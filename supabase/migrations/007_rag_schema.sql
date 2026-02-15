-- =============================================
-- RAG Chatbot Schema
-- =============================================

-- Document chunks: stores chunked + embedded vault content
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,

  -- Origin tracking
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('source', 'annotation', 'file')),
  source_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,

  -- Content
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- Embedding vector (768 dimensions — gemini-embedding-001 truncated via outputDimensionality)
  embedding vector(768),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(source_type, source_id, chunk_index)
);

-- Indexes
CREATE INDEX idx_chunks_vault_id ON document_chunks(vault_id);
CREATE INDEX idx_chunks_source ON document_chunks(source_type, source_id);

-- HNSW index for fast cosine similarity search
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =============================================
-- Chat history tables
-- =============================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vault_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_conv_vault_user ON chat_conversations(vault_id, user_id);
CREATE INDEX idx_chat_messages_conv ON chat_messages(conversation_id, created_at);

-- =============================================
-- Vector similarity search RPC function
-- =============================================

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
