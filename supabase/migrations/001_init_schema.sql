-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSON operators
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- Supabase manages this automatically, but we can reference it

-- Vaults table
CREATE TABLE IF NOT EXISTS vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on owner_id and created_at for faster queries
CREATE INDEX idx_vaults_owner_id ON vaults(owner_id);
CREATE INDEX idx_vaults_created_at ON vaults(created_at);

-- Vault Members table (with role-based access)
CREATE TABLE IF NOT EXISTS vault_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'contributor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vault_id, user_id),
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes on vault_id and user_id
CREATE INDEX idx_vault_members_vault_id ON vault_members(vault_id);
CREATE INDEX idx_vault_members_user_id ON vault_members(user_id);

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  title VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vault_id, url),
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes on vault_id and created_at
CREATE INDEX idx_sources_vault_id ON sources(vault_id);
CREATE INDEX idx_sources_created_at ON sources(created_at);

-- Annotations table
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes on source_id and created_at
CREATE INDEX idx_annotations_source_id ON annotations(source_id);
CREATE INDEX idx_annotations_created_at ON annotations(created_at);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  file_url VARCHAR(2048) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT,
  checksum VARCHAR(64),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes on vault_id and created_at
CREATE INDEX idx_files_vault_id ON files(vault_id);
CREATE INDEX idx_files_created_at ON files(created_at);

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes on vault_id and timestamp
CREATE INDEX idx_activity_logs_vault_id ON activity_logs(vault_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Create indexes on action_type for faster filtering
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
