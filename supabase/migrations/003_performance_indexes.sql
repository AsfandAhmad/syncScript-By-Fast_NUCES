-- ================================================================
-- Migration 003: Performance indexes & optimisations
-- ================================================================
-- Adds composite and covering indexes that accelerate the most
-- frequent query patterns (vault pages, source listings, member
-- lookups) and prevent N+1 issues.
-- ================================================================

-- Composite index for fetching sources by vault, ordered by recency
-- Covers the GET /vault/:id/sources query directly.
CREATE INDEX IF NOT EXISTS idx_sources_vault_id_created_at
  ON sources (vault_id, created_at DESC);

-- Composite index for annotations by source, ordered by recency
CREATE INDEX IF NOT EXISTS idx_annotations_source_id_created_at
  ON annotations (source_id, created_at DESC);

-- Composite index for vault members — lookup by vault + user
CREATE INDEX IF NOT EXISTS idx_vault_members_vault_user
  ON vault_members (vault_id, user_id);

-- Composite index for activity logs — vault + timestamp (desc)
CREATE INDEX IF NOT EXISTS idx_activity_logs_vault_timestamp
  ON activity_logs (vault_id, timestamp DESC);

-- Index on files by vault for file list queries
CREATE INDEX IF NOT EXISTS idx_files_vault_id_created_at
  ON files (vault_id, created_at DESC);

-- Index on vaults by owner for dashboard queries
CREATE INDEX IF NOT EXISTS idx_vaults_owner_created
  ON vaults (owner_id, created_at DESC);

-- Enable Supabase Realtime on the tables we subscribe to
-- (idempotent — harmless if already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE vaults;
ALTER PUBLICATION supabase_realtime ADD TABLE sources;
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_members;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
