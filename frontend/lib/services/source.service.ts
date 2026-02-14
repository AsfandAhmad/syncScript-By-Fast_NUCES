import supabase from '../supabase-client';
import { Source, ApiResponse, PaginatedResponse } from '../database.types';

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

/**
 * Source Management Services
 * All requests go through Next.js API routes (which use service_role to bypass RLS)
 */

export const sourceService = {
  /**
   * Get all sources for a vault with pagination
   */
  async getSourcesByVault(
    vaultId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedResponse<Source>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/vaults/${vaultId}/sources?limit=${limit}&offset=${offset}`,
        { headers }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { data: [], count: 0, error: body.error || `Request failed (${response.status})` };
      }

      const { data, count } = await response.json();
      return { data: data || [], count: count || 0, error: null };
    } catch (err) {
      return { data: [], count: 0, error: String(err) };
    }
  },

  /**
   * Get a specific source by ID
   */
  async getSourceById(sourceId: string): Promise<ApiResponse<Source>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/sources/${sourceId}`, { headers });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { data: null, error: body.error || `Request failed (${response.status})`, status: 'error' };
      }

      const { data } = await response.json();
      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Create a new source
   */
  async createSource(
    vaultId: string,
    url: string,
    title?: string,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<Source>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults/${vaultId}/sources`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, title, metadata }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { data: null, error: body.error || `Request failed (${response.status})`, status: 'error' };
      }

      const { data } = await response.json();
      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Update a source
   */
  async updateSource(
    sourceId: string,
    updates: Partial<Source>
  ): Promise<ApiResponse<Source>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { data: null, error: body.error || `Request failed (${response.status})`, status: 'error' };
      }

      const { data } = await response.json();
      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Delete a source
   */
  async deleteSource(sourceId: string): Promise<ApiResponse<null>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { data: null, error: body.error || `Request failed (${response.status})`, status: 'error' };
      }

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },
};
