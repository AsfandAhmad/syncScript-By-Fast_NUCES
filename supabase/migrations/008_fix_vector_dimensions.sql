-- Fix: update vector dimensions from 768 to 3072 for gemini-embedding-001
-- Run this in Supabase SQL Editor AFTER 007_rag_schema.sql

-- Drop the old HNSW index (it references the old dimension)
DROP INDEX IF EXISTS idx_chunks_embedding;

-- Drop the old RPC function
DROP FUNCTION IF EXISTS match_vault_chunks;

-- Alter the column to use 3072 dimensions
ALTER TABLE document_chunks
  DROP COLUMN IF EXISTS embedding;

ALTER TABLE document_chunks
  ADD COLUMN embedding vector(3072);

-- Recreate HNSW index with new dimensions
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Recreate RPC function with new dimensions
CREATE OR REPLACE FUNCTION match_vault_chunks(
  p_vault_id UUID,
  p_query_embedding vector(3072),
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
