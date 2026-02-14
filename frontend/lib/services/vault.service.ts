import supabase from '../supabase-client';
import { Vault, VaultMember, ApiResponse } from '../database.types';

/**
 * Vault Management Services
 */

export const vaultService = {
  /**
   * Get all vaults for the current user
   */
  async getAllVaults(): Promise<ApiResponse<Vault[]>> {
    try {
      const { data, error } = await supabase
        .from('vaults')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

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
      const { data, error } = await supabase
        .from('vaults')
        .select('*')
        .eq('id', vaultId)
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Create a new vault
   */
  async createVault(name: string, description?: string): Promise<ApiResponse<Vault>> {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        return { data: null, error: 'User not authenticated', status: 'error' };
      }

      const { data, error } = await supabase
        .from('vaults')
        .insert({
          name,
          description,
          owner_id: user.user.id,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      // Automatically add creator as owner in vault_members
      await supabase.from('vault_members').insert({
        vault_id: data.id,
        user_id: user.user.id,
        role: 'owner',
      });

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
      const { data, error } = await supabase
        .from('vaults')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vaultId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

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
      const { error } = await supabase.from('vaults').delete().eq('id', vaultId);

      if (error) {
        return { data: null, error: error.message, status: 'error' };
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
      const { data, error } = await supabase
        .from('vault_members')
        .select('*')
        .eq('vault_id', vaultId);

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

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
      const { data, error } = await supabase
        .from('vault_members')
        .insert({
          vault_id: vaultId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

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
      const { data, error } = await supabase
        .from('vault_members')
        .update({ role: newRole })
        .eq('vault_id', vaultId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

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
      // Check if this is the last owner
      const { data: members } = await supabase
        .from('vault_members')
        .select('*')
        .eq('vault_id', vaultId)
        .eq('role', 'owner');

      if (members && members.length === 1 && members[0].user_id === userId) {
        return {
          data: null,
          error: 'Cannot remove the last owner from vault',
          status: 'error',
        };
      }

      const { error } = await supabase
        .from('vault_members')
        .delete()
        .eq('vault_id', vaultId)
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },
};
