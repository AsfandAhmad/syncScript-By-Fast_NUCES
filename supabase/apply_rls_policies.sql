-- ============================================================
-- RLS POLICIES SETUP SCRIPT
-- Run this in the Supabase Dashboard SQL Editor to properly
-- apply Row Level Security policies.
-- 
-- This script is safe to run multiple times (idempotent).
-- ============================================================

-- First, drop any existing policies to avoid conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('vaults', 'vault_members', 'sources', 'annotations', 'files', 'activity_logs')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Ensure RLS is enabled on all tables
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============ VAULTS RLS POLICIES ============

CREATE POLICY "Users can view their vaults"
  ON vaults FOR SELECT
  USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM vault_members 
      WHERE vault_members.vault_id = vaults.id 
        AND vault_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can update vaults"
  ON vaults FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Only owners can delete vaults"
  ON vaults FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create vaults"
  ON vaults FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ============ VAULT MEMBERS RLS POLICIES ============

CREATE POLICY "Users can view vault members"
  ON vault_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vault_members vm
      WHERE vm.vault_id = vault_members.vault_id 
        AND vm.user_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can manage members"
  ON vault_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vaults
      WHERE vaults.id = vault_id AND vaults.owner_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can update member roles"
  ON vault_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vaults
      WHERE vaults.id = vault_members.vault_id 
        AND vaults.owner_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can remove members"
  ON vault_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vaults
      WHERE vaults.id = vault_members.vault_id 
        AND vaults.owner_id = auth.uid()
    )
  );

-- ============ SOURCES RLS POLICIES ============

CREATE POLICY "Users can view sources in their vaults"
  ON sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vault_members 
      WHERE vault_members.vault_id = sources.vault_id 
        AND vault_members.user_id = auth.uid()
    )
    OR sources.vault_id IN (
      SELECT id FROM vaults WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Contributors and owners can add sources"
  ON sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_members 
      WHERE vault_members.vault_id = vault_id 
        AND vault_members.user_id = auth.uid()
        AND role IN ('owner', 'contributor')
    )
    OR vault_id IN (
      SELECT id FROM vaults WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Contributors and owners can update sources"
  ON sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vault_members 
      WHERE vault_members.vault_id = sources.vault_id 
        AND vault_members.user_id = auth.uid()
        AND role IN ('owner', 'contributor')
    )
    OR sources.vault_id IN (
      SELECT id FROM vaults WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Creators and owners can delete sources"
  ON sources FOR DELETE
  USING (
    created_by = auth.uid()
    OR sources.vault_id IN (
      SELECT id FROM vaults WHERE owner_id = auth.uid()
    )
  );

-- ============ ANNOTATIONS RLS POLICIES ============

CREATE POLICY "Users can view annotations in their vaults"
  ON annotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sources s
      WHERE s.id = annotations.source_id
        AND (
          EXISTS (
            SELECT 1 FROM vault_members 
            WHERE vault_members.vault_id = s.vault_id 
              AND vault_members.user_id = auth.uid()
          )
          OR s.vault_id IN (
            SELECT id FROM vaults WHERE owner_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Contributors and owners can add annotations"
  ON annotations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sources s
      WHERE s.id = source_id
        AND (
          EXISTS (
            SELECT 1 FROM vault_members 
            WHERE vault_members.vault_id = s.vault_id 
              AND vault_members.user_id = auth.uid()
              AND role IN ('owner', 'contributor')
          )
          OR s.vault_id IN (
            SELECT id FROM vaults WHERE owner_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Contributors and owners can update annotations"
  ON annotations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sources s
      WHERE s.id = annotations.source_id
        AND (
          EXISTS (
            SELECT 1 FROM vault_members 
            WHERE vault_members.vault_id = s.vault_id 
              AND vault_members.user_id = auth.uid()
              AND role IN ('owner', 'contributor')
          )
          OR s.vault_id IN (
            SELECT id FROM vaults WHERE owner_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Creators can delete annotations"
  ON annotations FOR DELETE
  USING (created_by = auth.uid());

-- ============ FILES RLS POLICIES ============

CREATE POLICY "Users can view files in their vaults"
  ON files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vault_members 
      WHERE vault_members.vault_id = files.vault_id 
        AND vault_members.user_id = auth.uid()
    )
    OR files.vault_id IN (
      SELECT id FROM vaults WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Contributors and owners can upload files"
  ON files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_members 
      WHERE vault_members.vault_id = vault_id 
        AND vault_members.user_id = auth.uid()
        AND role IN ('owner', 'contributor')
    )
    OR vault_id IN (
      SELECT id FROM vaults WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Uploaders and owners can delete files"
  ON files FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR files.vault_id IN (
      SELECT id FROM vaults WHERE owner_id = auth.uid()
    )
  );

-- ============ ACTIVITY LOGS RLS POLICIES ============

CREATE POLICY "Users can view activity logs in their vaults"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vault_members 
      WHERE vault_members.vault_id = activity_logs.vault_id 
        AND vault_members.user_id = auth.uid()
    )
    OR activity_logs.vault_id IN (
      SELECT id FROM vaults WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- ============ DONE ============
-- All RLS policies have been applied successfully.
