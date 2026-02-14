// Unified Type Definitions - Single source of truth
// Maps directly to the Supabase database schema (snake_case)

export type Role = 'owner' | 'contributor' | 'viewer';

export interface Vault {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaultMember {
  id: string;
  vault_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  email?: string;
}

export interface Source {
  id: string;
  vault_id: string;
  url: string;
  title?: string;
  metadata: Record<string, any>;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: string;
  source_id: string;
  content: string;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  vault_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  checksum: string;
  uploaded_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  vault_id: string;
  action_type: string;
  actor_id?: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: string | null;
}

export const ACTION_LABELS: Record<string, { label: string; category: string }> = {
  vault_created: { label: 'created the vault', category: 'vault' },
  source_added: { label: 'added a source', category: 'source' },
  source_created: { label: 'added a source', category: 'source' },
  source_updated: { label: 'updated a source', category: 'source' },
  source_deleted: { label: 'removed a source', category: 'source' },
  annotation_added: { label: 'added an annotation', category: 'annotation' },
  annotation_created: { label: 'added an annotation', category: 'annotation' },
  annotation_updated: { label: 'updated an annotation', category: 'annotation' },
  annotation_deleted: { label: 'removed an annotation', category: 'annotation' },
  file_uploaded: { label: 'uploaded a file', category: 'file' },
  file_deleted: { label: 'deleted a file', category: 'file' },
  member_added: { label: 'added a member', category: 'member' },
  member_removed: { label: 'removed a member', category: 'member' },
};
