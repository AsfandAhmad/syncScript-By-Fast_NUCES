import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { chunkSource, chunkAnnotation, chunkFile } from '@/lib/rag/chunker';
import { embedTexts } from '@/lib/rag/embeddings';
import { extractFileContent } from '@/lib/rag/file-extractor';
import type { Chunk } from '@/lib/rag/chunker';

const EMBED_BATCH = 10; // Small batches to avoid OOM

/**
 * Embed a small batch of chunks and insert them into DB immediately,
 * then release memory. Returns count of inserted chunks.
 */
async function embedAndInsert(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  vaultId: string,
  chunks: Chunk[]
): Promise<number> {
  if (chunks.length === 0) return 0;

  const texts = chunks.map((c) => c.content);
  const embeddings = await embedTexts(texts);

  const rows = chunks.map((chunk, j) => ({
    vault_id: vaultId,
    source_type: chunk.metadata.source_type as string,
    source_id: chunk.metadata.source_id as string,
    content: chunk.content,
    embedding: JSON.stringify(embeddings[j]),
    metadata: chunk.metadata,
  }));

  await supabase.from('document_chunks').insert(rows);
  return rows.length;
}

/**
 * POST /api/chat/index-vault — Incremental, memory-efficient index.
 * Processes items one at a time and embeds in small batches (10)
 * to avoid OOM crashes.
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

    // Get IDs of content already indexed (to skip them)
    const { data: existingChunks } = await supabase
      .from('document_chunks')
      .select('source_id, source_type')
      .eq('vault_id', vaultId);

    const indexedIds = new Set(
      (existingChunks || []).map((c) => `${c.source_type}:${c.source_id}`)
    );

    let indexedSources = 0;
    let indexedAnnotations = 0;
    let indexedFiles = 0;
    let skippedAlreadyIndexed = 0;
    let totalChunks = 0;

    // Buffer for pending chunks — flush when it reaches EMBED_BATCH
    let pendingChunks: Chunk[] = [];

    async function flushPending() {
      if (pendingChunks.length === 0) return;
      try {
        totalChunks += await embedAndInsert(supabase, vaultId, pendingChunks);
      } catch (err) {
        console.error('[index-vault] embed batch error:', err);
      }
      pendingChunks = []; // release memory
    }

    async function addChunks(chunks: Chunk[]) {
      for (const chunk of chunks) {
        pendingChunks.push(chunk);
        if (pendingChunks.length >= EMBED_BATCH) {
          await flushPending();
        }
      }
    }

    // Fetch metadata (lightweight — no file content yet)
    const [sourcesRes, annotationsRes, filesRes] = await Promise.all([
      supabase.from('sources').select('*').eq('vault_id', vaultId),
      supabase.from('annotations').select('*, sources!inner(vault_id, title)').eq('sources.vault_id', vaultId),
      supabase.from('files').select('id, file_url, file_name, file_size, vault_id, folder, uploaded_by, created_at').eq('vault_id', vaultId),
    ]);

    // Process sources one by one
    for (const source of sourcesRes.data || []) {
      if (indexedIds.has(`source:${source.id}`)) { skippedAlreadyIndexed++; continue; }
      try {
        const chunks = chunkSource(source);
        if (chunks.length > 0) { await addChunks(chunks); indexedSources++; }
      } catch (err) { console.error(`[index-vault] source ${source.id}:`, err); }
    }

    // Process annotations one by one
    for (const annotation of annotationsRes.data || []) {
      if (indexedIds.has(`annotation:${annotation.id}`)) { skippedAlreadyIndexed++; continue; }
      try {
        const sourceTitle = (annotation as any).sources?.title || 'source';
        const chunks = chunkAnnotation(annotation, sourceTitle);
        if (chunks.length > 0) { await addChunks(chunks); indexedAnnotations++; }
      } catch (err) { console.error(`[index-vault] annotation ${annotation.id}:`, err); }
    }

    // Process files ONE AT A TIME (each may download content)
    for (const file of filesRes.data || []) {
      if (indexedIds.has(`file:${file.id}`)) { skippedAlreadyIndexed++; continue; }
      try {
        const textContent = await extractFileContent(file.file_url, file.file_name, file.file_size);
        const chunks = chunkFile(file, textContent);
        if (chunks.length > 0) { await addChunks(chunks); indexedFiles++; }
      } catch (err) { console.error(`[index-vault] file ${file.id}:`, err); }
    }

    // Flush remaining
    await flushPending();

    return NextResponse.json({
      success: true,
      stats: {
        totalChunks,
        indexedSources,
        indexedAnnotations,
        indexedFiles,
        skippedAlreadyIndexed,
        ...(totalChunks === 0 && skippedAlreadyIndexed > 0
          ? { message: 'All content is already indexed' }
          : {}),
      },
    });
  } catch (err) {
    console.error('[index-vault] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
