import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { chunkSource, chunkAnnotation, chunkFile } from '@/lib/rag/chunker';
import { embedTexts } from '@/lib/rag/embeddings';
import { extractFileContent } from '@/lib/rag/file-extractor';
import type { Chunk } from '@/lib/rag/chunker';

/**
 * POST /api/chat/index-vault — Bulk-index all existing content in a vault.
 * Optimized: collects all chunks first, then embeds in large parallel batches.
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

    let indexedSources = 0;
    let indexedAnnotations = 0;
    let indexedFiles = 0;

    // ====== Phase 1: Collect all chunks (fast, no API calls) ======
    const allChunks: Chunk[] = [];

    // Fetch all data in parallel
    const [sourcesRes, annotationsRes, filesRes] = await Promise.all([
      supabase.from('sources').select('*').eq('vault_id', vaultId),
      supabase.from('annotations').select('*, sources!inner(vault_id, title)').eq('sources.vault_id', vaultId),
      supabase.from('files').select('*').eq('vault_id', vaultId),
    ]);

    // Chunk sources
    const sources = sourcesRes.data || [];
    for (const source of sources) {
      try {
        const chunks = chunkSource(source);
        if (chunks.length > 0) {
          allChunks.push(...chunks);
          indexedSources++;
        }
      } catch (err) {
        console.error(`[index-vault] source ${source.id}:`, err);
      }
    }

    // Chunk annotations
    const annotations = annotationsRes.data || [];
    for (const annotation of annotations) {
      try {
        const sourceTitle = (annotation as any).sources?.title || 'source';
        const chunks = chunkAnnotation(annotation, sourceTitle);
        if (chunks.length > 0) {
          allChunks.push(...chunks);
          indexedAnnotations++;
        }
      } catch (err) {
        console.error(`[index-vault] annotation ${annotation.id}:`, err);
      }
    }

    // Extract file content + chunk (may involve downloads for real files)
    const files = filesRes.data || [];
    // Process files in parallel (up to 5 concurrent)
    const fileChunkResults = await parallelMap(files, async (file) => {
      try {
        const textContent = await extractFileContent(
          file.file_url,
          file.file_name,
          file.file_size
        );
        return chunkFile(file, textContent);
      } catch (err) {
        console.error(`[index-vault] file ${file.id}:`, err);
        return [];
      }
    }, 5);

    for (const chunks of fileChunkResults) {
      if (chunks.length > 0) {
        allChunks.push(...chunks);
        indexedFiles++;
      }
    }

    // ====== Phase 2: Embed + insert in large batches ======
    const BATCH_SIZE = 50; // Gemini supports up to 100, use 50 for safety
    let totalChunks = 0;

    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);

      try {
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
        totalChunks += rows.length;
      } catch (err) {
        console.error(`[index-vault] batch ${i}-${i + batch.length}:`, err);
        // Continue with remaining batches even if one fails
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
 * Run async tasks in parallel with a concurrency limit.
 */
async function parallelMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
