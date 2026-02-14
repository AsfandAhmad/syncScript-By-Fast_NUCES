import supabase from '../supabase-client';
import { Annotation, ApiResponse, PaginatedResponse } from '../database.types';

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
 * Annotation Management Services
 * All requests go through Next.js API routes (which use service_role to bypass RLS)
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
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/annotations?source_id=${sourceId}&limit=${limit}&offset=${offset}`,
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
   * Get a specific annotation by ID
   */
  async getAnnotationById(annotationId: string): Promise<ApiResponse<Annotation>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/annotations/${annotationId}`, { headers });

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
   * Create a new annotation
   */
  async createAnnotation(sourceId: string, content: string): Promise<ApiResponse<Annotation>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers,
        body: JSON.stringify({ source_id: sourceId, content }),
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
   * Update an annotation
   */
  async updateAnnotation(
    annotationId: string,
    content: string
  ): Promise<ApiResponse<Annotation>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/annotations/${annotationId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ content }),
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
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string): Promise<ApiResponse<null>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/annotations/${annotationId}`, {
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
