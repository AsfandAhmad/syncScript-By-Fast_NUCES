// Database Type Definitions

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
  role: 'owner' | 'contributor' | 'viewer';
  joined_at: string;
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

export interface File {
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

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  nextCursor?: string;
  error: string | null;
}
