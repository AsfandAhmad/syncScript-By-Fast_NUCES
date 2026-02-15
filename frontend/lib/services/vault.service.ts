import supabase from '../supabase-client';
import { Vault, VaultMember, ApiResponse } from '../database.types';

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
 * Vault Management Services
 * All requests go through Next.js API routes (which use service_role to bypass RLS)
 */
export const vaultService = {
  /**
   * Get all vaults for the current user
   */
  async getAllVaults(): Promise<ApiResponse<Vault[]>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/vaults', { headers });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      return { data: data || [], error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Get a specific vault by ID
   */
  async getVaultById(vaultId: string): Promise<ApiResponse<Vault>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults?id=${vaultId}`, { headers });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      // If we get an array, find the specific vault
      const vault = Array.isArray(data) ? data.find((v: Vault) => v.id === vaultId) : data;
      return { data: vault || null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Create a new vault
   */
  /**
   * Get all public vaults
   */
  async getPublicVaults(): Promise<ApiResponse<Vault[]>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/vaults/public', { headers });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      return { data: data || [], error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Join a public vault as a viewer
   */
  async joinPublicVault(vaultId: string): Promise<ApiResponse<VaultMember>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults/${vaultId}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: 'self', role: 'viewer' }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Create a new vault
   */
  async createVault(name: string, description?: string, is_public?: boolean): Promise<ApiResponse<Vault>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/vaults', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description, is_public: is_public ?? false }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Update a vault
   */
  async updateVault(
    vaultId: string,
    updates: Partial<Vault>
  ): Promise<ApiResponse<Vault>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults?id=${vaultId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Delete a vault
   */
  async deleteVault(vaultId: string): Promise<ApiResponse<null>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults?id=${vaultId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Get vault members
   */
  async getVaultMembers(vaultId: string): Promise<ApiResponse<VaultMember[]>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults/${vaultId}/members`, { headers });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      return { data: data || [], error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Add a member to vault
   */
  async addVaultMember(
    vaultId: string,
    userId: string,
    role: 'owner' | 'contributor' | 'viewer'
  ): Promise<ApiResponse<VaultMember>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults/${vaultId}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId, role }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Update member role
   */
  async updateMemberRole(
    vaultId: string,
    userId: string,
    newRole: 'owner' | 'contributor' | 'viewer'
  ): Promise<ApiResponse<VaultMember>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults/${vaultId}/members`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      const { data } = await response.json();
      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Remove a member from vault
   */
  async removeVaultMember(vaultId: string, userId: string): Promise<ApiResponse<null>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/vaults/${vaultId}/members?user_id=${userId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return {
          data: null,
          error: body.error || `Request failed (${response.status})`,
          status: 'error',
        };
      }

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },
};
