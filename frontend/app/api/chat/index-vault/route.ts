import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { chunkSource, chunkAnnotation, chunkFile } from '@/lib/rag/chunker';
import { embedTexts } from '@/lib/rag/embeddings';
import type { Chunk } from '@/lib/rag/chunker';

/**
 * POST /api/chat/index-vault — Bulk-index all existing content in a vault.
 * This is needed to backfill embeddings for content created before RAG was enabled.
 *
 * Body: { vaultId }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) return unauthorizedResponse(authError || undefined);

    const { vaultId } = await request.json();
    if (!vaultId) {
      return NextResponse.json({ error: 'vaultId is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verify vault membership
    const { data: member } = await supabase
      .from('vault_members')
      .select('role')
      .eq('vault_id', vaultId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this vault' }, { status: 403 });
    }

    // Clear all existing chunks for this vault (re-index fresh)
    await supabase.from('document_chunks').delete().eq('vault_id', vaultId);

    let totalChunks = 0;
    let indexedSources = 0;
    let indexedAnnotations = 0;
    let indexedFiles = 0;

    // ------ Index all sources ------
    const { data: sources } = await supabase
      .from('sources')
      .select('*')
      .eq('vault_id', vaultId);

    if (sources && sources.length > 0) {
      for (const source of sources) {
        try {
          const chunks = chunkSource(source);
          if (chunks.length > 0) {
            await insertChunksBatch(supabase, vaultId, chunks);
            totalChunks += chunks.length;
            indexedSources++;
          }
        } catch (err) {
          console.error(`[index-vault] Failed to index source ${source.id}:`, err);
        }
      }
    }

    // ------ Index all annotations ------
    const { data: annotations } = await supabase
      .from('annotations')
      .select('*, sources!inner(vault_id, title)')
      .eq('sources.vault_id', vaultId);

    if (annotations && annotations.length > 0) {
      for (const annotation of annotations) {
        try {
          const sourceTitle = (annotation as any).sources?.title || 'source';
          const chunks = chunkAnnotation(annotation, sourceTitle);
          if (chunks.length > 0) {
            await insertChunksBatch(supabase, vaultId, chunks);
            totalChunks += chunks.length;
            indexedAnnotations++;
          }
        } catch (err) {
          console.error(`[index-vault] Failed to index annotation ${annotation.id}:`, err);
        }
      }
    }

    // ------ Index all files ------
    const { data: files } = await supabase
      .from('files')
      .select('*')
      .eq('vault_id', vaultId);

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const textContent = `File: ${file.file_name}`;
          const chunks = chunkFile(file, textContent);
          if (chunks.length > 0) {
            await insertChunksBatch(supabase, vaultId, chunks);
            totalChunks += chunks.length;
            indexedFiles++;
          }
        } catch (err) {
          console.error(`[index-vault] Failed to index file ${file.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalChunks,
        indexedSources,
        indexedAnnotations,
        indexedFiles,
      },
    });
  } catch (err) {
    console.error('[index-vault] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * Insert chunks with embeddings in batches to avoid hitting API limits.
 */
async function insertChunksBatch(
  supabase: any,
  vaultId: string,
  chunks: Chunk[],
  batchSize = 10
) {
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content);
    const embeddings = await embedTexts(texts);

    const rows = batch.map((chunk, j) => ({
      vault_id: vaultId,
      source_type: chunk.metadata.source_type as string,
      source_id: chunk.metadata.source_id as string,
      content: chunk.content,
      embedding: JSON.stringify(embeddings[j]),
      metadata: chunk.metadata,
    }));

    await supabase.from('document_chunks').insert(rows);
  }
}
