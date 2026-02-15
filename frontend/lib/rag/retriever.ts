/**
 * Vector retrieval for RAG pipeline.
 * Searches document_chunks using Supabase pgvector via RPC.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { embedText } from './embeddings';
import type { ChatCitation } from '@/lib/database.types';

export interface RetrievedChunk {
  id: string;
  source_type: string;
  source_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

/**
 * Retrieve the most relevant chunks for a query from a vault.
 */
export async function retrieveChunks(
  vaultId: string,
  query: string,
  topK = 8,
  threshold = 0.5
): Promise<RetrievedChunk[]> {
  const supabase = createServerSupabaseClient();

  // 1. Embed the query
  const queryEmbedding = await embedText(query);

  // 2. Call the Supabase RPC function for vector similarity search
  const { data, error } = await supabase.rpc('match_vault_chunks', {
    p_vault_id: vaultId,
    p_query_embedding: JSON.stringify(queryEmbedding),
    p_match_count: topK,
    p_match_threshold: threshold,
  });

  if (error) {
    console.error('[retriever] RPC error:', error.message);
    // Fallback: fetch all chunks for this vault and do cosine similarity in JS
    return fallbackRetrieval(vaultId, queryEmbedding, topK, threshold);
  }

  return (data || []) as RetrievedChunk[];
}

/**
 * Fallback: in-memory cosine similarity when pgvector RPC is unavailable.
 */
async function fallbackRetrieval(
  vaultId: string,
  queryEmbedding: number[],
  topK: number,
  threshold: number
): Promise<RetrievedChunk[]> {
  const supabase = createServerSupabaseClient();

  const { data: chunks, error } = await supabase
    .from('document_chunks')
    .select('id, source_type, source_id, chunk_index, content, metadata, embedding')
    .eq('vault_id', vaultId)
    .limit(200);

  if (error || !chunks) {
    console.error('[retriever] fallback query error:', error?.message);
    return [];
  }

  // Compute cosine similarity in JS
  const scored = chunks
    .filter((c: any) => c.embedding)
    .map((c: any) => {
      const emb = typeof c.embedding === 'string' ? JSON.parse(c.embedding) : c.embedding;
      const sim = cosineSimilarity(queryEmbedding, emb);
      return { ...c, similarity: sim, embedding: undefined };
    })
    .filter((c: any) => c.similarity > threshold)
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, topK);

  return scored;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Format retrieved chunks into a context string for the LLM prompt,
 * and extract citation references.
 */
export function formatContext(chunks: RetrievedChunk[]): {
  contextText: string;
  citations: ChatCitation[];
} {
  if (chunks.length === 0) {
    return { contextText: 'No relevant content found in this vault.', citations: [] };
  }

  const citations: ChatCitation[] = [];
  const lines: string[] = [];

  chunks.forEach((chunk, i) => {
    const num = i + 1;
    const meta = chunk.metadata || {};
    const title = meta.title || meta.file_name || `${chunk.source_type} ${chunk.source_id.slice(0, 8)}`;
    const author = meta.author_name || meta.author_email || '';

    lines.push(`[Source ${num}] (${chunk.source_type}) "${title}"${author ? ` by ${author}` : ''}`);
    lines.push(chunk.content);
    lines.push('');

    citations.push({
      source_type: chunk.source_type as ChatCitation['source_type'],
      source_id: chunk.source_id,
      title,
      snippet: chunk.content.slice(0, 150),
    });
  });

  return { contextText: lines.join('\n'), citations };
}
