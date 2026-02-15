import { createServerSupabaseClient } from '@/lib/supabase-server';
import { chunkSource, chunkAnnotation, chunkFile } from './chunker';
import { embedTexts } from './embeddings';
import type { Chunk } from './chunker';

/**
 * Fire-and-forget helper to index content into document_chunks for RAG.
 * Errors are caught silently so embedding failures never break core flows.
 */

async function insertChunks(vaultId: string, chunks: Chunk[]) {
  if (chunks.length === 0) return;
  const supabase = createServerSupabaseClient();

  const texts = chunks.map((c) => c.content);
  const embeddings = await embedTexts(texts);

  const rows = chunks.map((chunk, i) => ({
    vault_id: vaultId,
    source_type: chunk.metadata.source_type as string,
    source_id: chunk.metadata.source_id as string,
    content: chunk.content,
    embedding: JSON.stringify(embeddings[i]),
    metadata: chunk.metadata,
  }));

  await supabase.from('document_chunks').insert(rows);
}

export async function indexSource(sourceId: string, vaultId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: source } = await supabase
      .from('sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (!source) return;

    // Remove old chunks first
    await supabase
      .from('document_chunks')
      .delete()
      .eq('source_type', 'source')
      .eq('source_id', sourceId);

    const chunks = chunkSource(source);
    await insertChunks(vaultId, chunks);
  } catch {
    // Silently fail – embedding should never block core functionality
  }
}

export async function indexAnnotation(annotationId: string, vaultId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: annotation } = await supabase
      .from('annotations')
      .select('*')
      .eq('id', annotationId)
      .single();

    if (!annotation) return;

    await supabase
      .from('document_chunks')
      .delete()
      .eq('source_type', 'annotation')
      .eq('source_id', annotationId);

    const chunks = chunkAnnotation(annotation);
    await insertChunks(vaultId, chunks);
  } catch {
    // Silently fail
  }
}

export async function indexFile(fileId: string, vaultId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: file } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (!file) return;

    await supabase
      .from('document_chunks')
      .delete()
      .eq('source_type', 'file')
      .eq('source_id', fileId);

    // For files, we use the file_name as text content placeholder.
    // Full text extraction (PDF parsing, etc.) would be added in a future phase.
    const textContent = `File: ${file.file_name}`;
    const chunks = chunkFile(file, textContent);
    await insertChunks(vaultId, chunks);
  } catch {
    // Silently fail
  }
}

export async function deleteChunks(sourceType: string, sourceId: string) {
  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('document_chunks')
      .delete()
      .eq('source_type', sourceType)
      .eq('source_id', sourceId);
  } catch {
    // Silently fail
  }
}
