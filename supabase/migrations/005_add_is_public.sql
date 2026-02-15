-- Add is_public column to vaults table
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → paste & run

ALTER TABLE vaults ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_vaults_is_public ON vaults(is_public);
