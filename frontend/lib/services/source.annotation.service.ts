import supabase from '../supabase-client';
import { Annotation, ApiResponse, PaginatedResponse } from '../database.types';

/**
 * Annotation Management Services
 */

export const annotationService = {
  /**
   * Get all annotations for a source
   */
  async getAnnotationsBySource(
    sourceId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedResponse<Annotation>> {
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('annotations')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', sourceId);

      if (countError) {
        return { data: [], count: 0, error: countError.message };
      }

      // Get paginated data
      const { data, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('source_id', sourceId)
        .order('created_at', { ascending: true })
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
   * Get a specific annotation by ID
   */
  async getAnnotationById(annotationId: string): Promise<ApiResponse<Annotation>> {
    try {
      const { data, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('id', annotationId)
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
   * Create a new annotation
   */
  async createAnnotation(sourceId: string, content: string): Promise<ApiResponse<Annotation>> {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        return { data: null, error: 'User not authenticated', status: 'error' };
      }

      const { data, error } = await supabase
        .from('annotations')
        .insert({
          source_id: sourceId,
          content,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      // Log activity
      const { data: source } = await supabase
        .from('sources')
        .select('vault_id')
        .eq('id', sourceId)
        .single();

      if (source) {
        await supabase.from('activity_logs').insert({
          vault_id: source.vault_id,
          action_type: 'annotation_created',
          actor_id: user.user.id,
          metadata: { annotation_id: data.id, source_id: sourceId },
        });
      }

      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Update an annotation with optimistic locking
   */
  async updateAnnotation(
    annotationId: string,
    content: string
  ): Promise<ApiResponse<Annotation>> {
    try {
      // Get current annotation for version tracking
      const { data: currentAnnotation } = await supabase
        .from('annotations')
        .select('version, source_id')
        .eq('id', annotationId)
        .single();

      if (!currentAnnotation) {
        return { data: null, error: 'Annotation not found', status: 'error' };
      }

      const { data, error } = await supabase
        .from('annotations')
        .update({
          content,
          version: (currentAnnotation.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', annotationId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      // Log activity
      const { data: user } = await supabase.auth.getUser();
      const { data: source } = await supabase
        .from('sources')
        .select('vault_id')
        .eq('id', currentAnnotation.source_id)
        .single();

      if (source) {
        await supabase.from('activity_logs').insert({
          vault_id: source.vault_id,
          action_type: 'annotation_updated',
          actor_id: user.user?.id,
          metadata: { annotation_id: annotationId },
        });
      }

      return { data, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string): Promise<ApiResponse<null>> {
    try {
      const { data: annotation } = await supabase
        .from('annotations')
        .select('source_id')
        .eq('id', annotationId)
        .single();

      const { error } = await supabase.from('annotations').delete().eq('id', annotationId);

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      // Log activity
      const { data: user } = await supabase.auth.getUser();
      if (annotation) {
        const { data: source } = await supabase
          .from('sources')
          .select('vault_id')
          .eq('id', annotation.source_id)
          .single();

        if (source) {
          await supabase.from('activity_logs').insert({
            vault_id: source.vault_id,
            action_type: 'annotation_deleted',
            actor_id: user.user?.id,
            metadata: { annotation_id: annotationId },
          });
        }
      }

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },
};
