import supabase from '../supabase-client';
import { FileRecord, ApiResponse } from '../database.types';

/**
 * Helper to get the current user's access token for API requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

async function getAuthHeadersRaw(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

export const fileService = {
  async getFilesByVault(vaultId: string): Promise<ApiResponse<FileRecord[]>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults/${vaultId}/files`, { headers });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { data: null, error: body.error || `Request failed (${response.status})`, status: 'error' };
      }

      const { data } = await response.json();
      return { data: data || [], error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Upload a file via the server API route (bypasses storage RLS).
   * Sends the raw file as FormData so the server can upload to Supabase Storage
   * using the service_role key.
   */
  async uploadFile(
    vaultId: string,
    file: File,
    checksum: string
  ): Promise<ApiResponse<FileRecord>> {
    try {
      const authHeaders = await getAuthHeadersRaw();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('checksum', checksum);

      const response = await fetch(`/api/vaults/${vaultId}/files`, {
        method: 'POST',
        headers: authHeaders,   // no Content-Type - browser sets multipart boundary
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { data: null, error: body.error || 'Failed to upload file', status: 'error' };
      }

      const { data: fileRecord } = await response.json();
      return { data: fileRecord, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Delete file via server API route (handles both storage + DB deletion server-side).
   */
  async deleteFile(fileId: string, vaultId: string, storagePath: string): Promise<ApiResponse<null>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/vaults/${vaultId}/files?fileId=${fileId}&storagePath=${encodeURIComponent(storagePath)}`,
        { method: 'DELETE', headers }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { data: null, error: body.error || 'Failed to delete file', status: 'error' };
      }

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Get a signed URL via the server API route (bypasses storage RLS).
   */
  async getSignedUrl(storagePath: string, expiresIn: number = 3600) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/files/signed-url?path=${encodeURIComponent(storagePath)}&expiresIn=${expiresIn}`,
        { headers }
      );

      if (!response.ok) {
        return { url: null, error: 'Failed to get signed URL' };
      }

      const { url } = await response.json();
      return { url: url || null, error: null };
    } catch (err) {
      return { url: null, error: String(err) };
    }
  },
};
