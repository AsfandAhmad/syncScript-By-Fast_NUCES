-- Fix: ensure vector dimensions are 768 (gemini-embedding-001 with outputDimensionality=768)
-- Run this in Supabase SQL Editor to fix the embedding column and indexes

-- Drop the old HNSW index
DROP INDEX IF EXISTS idx_chunks_embedding;

-- Drop the old RPC function
DROP FUNCTION IF EXISTS match_vault_chunks;

-- Recreate the embedding column as 768 dimensions
ALTER TABLE document_chunks
  DROP COLUMN IF EXISTS embedding;

ALTER TABLE document_chunks
  ADD COLUMN embedding vector(768);

-- Recreate HNSW index
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Recreate RPC function
CREATE OR REPLACE FUNCTION match_vault_chunks(
  p_vault_id UUID,
  p_query_embedding vector(768),
  p_match_count INTEGER DEFAULT 8,
  p_match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  source_type VARCHAR,
  source_id UUID,
  chunk_index INTEGER,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.source_type,
    dc.source_id,
    dc.chunk_index,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> p_query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.vault_id = p_vault_id
    AND 1 - (dc.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
