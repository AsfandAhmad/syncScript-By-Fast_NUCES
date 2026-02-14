import supabase from '../supabase-client';
import { Source, ApiResponse, PaginatedResponse } from '../database.types';

/**
 * Source Management Services
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
      // Get total count
      const { count, error: countError } = await supabase
        .from('sources')
        .select('*', { count: 'exact', head: true })
        .eq('vault_id', vaultId);

      if (countError) {
        return { data: [], count: 0, error: countError.message };
      }

      // Get paginated data
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { data: [], count: 0, error: error.message };
      }

      return {
        data: data || [],
        count: count || 0,
        error: null,
      };
    } catch (err) {
      return { data: [], count: 0, error: String(err) };
    }
  },

  /**
   * Get a specific source by ID
   */
  async getSourceById(sourceId: string): Promise<ApiResponse<Source>> {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('id', sourceId)
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
   * Create a new source (with optional auto-citation)
   */
  async createSource(
    vaultId: string,
    url: string,
    title?: string,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<Source>> {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        return { data: null, error: 'User not authenticated', status: 'error' };
      }

      const { data, error } = await supabase
        .from('sources')
        .insert({
          vault_id: vaultId,
          url,
          title: title || 'Untitled Source',
          metadata: metadata || {},
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        vault_id: vaultId,
        action_type: 'source_created',
        actor_id: user.user.id,
        metadata: { source_id: data.id, title: data.title },
      });

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
      // Get the current version for optimistic locking
      const { data: currentSource } = await supabase
        .from('sources')
        .select('version, vault_id')
        .eq('id', sourceId)
        .single();

      if (!currentSource) {
        return { data: null, error: 'Source not found', status: 'error' };
      }

      const { data, error } = await supabase
        .from('sources')
        .update({
          ...updates,
          version: (currentSource.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sourceId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      // Log activity
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        vault_id: currentSource.vault_id,
        action_type: 'source_updated',
        actor_id: user.user?.id,
        metadata: { source_id: sourceId },
      });

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
      const { data: source } = await supabase
        .from('sources')
        .select('vault_id')
        .eq('id', sourceId)
        .single();

      const { error } = await supabase.from('sources').delete().eq('id', sourceId);

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      // Log activity
      const { data: user } = await supabase.auth.getUser();
      if (source) {
        await supabase.from('activity_logs').insert({
          vault_id: source.vault_id,
          action_type: 'source_deleted',
          actor_id: user.user?.id,
          metadata: { source_id: sourceId },
        });
      }

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },
};
