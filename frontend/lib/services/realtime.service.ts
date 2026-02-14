import supabase from '../supabase-client';
import { Vault, Source, Annotation, VaultMember } from '../database.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Real-Time Collaboration Service
 * Uses Supabase Realtime for WebSocket updates
 */

export type RealtimeCallback<T> = (payload: T) => void;

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}

export const realtimeService = {
  /**
   * Subscribe to vault changes (new sources, members added, etc.)
   */
  subscribeToVault(vaultId: string, callback: RealtimeCallback<any>) {
    const channel = supabase
      .channel(`vault:${vaultId}`)
      .on(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: 'vaults',
          filter: `id=eq.${vaultId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'vault_updated', payload });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to source changes in a vault
   */
  subscribeToSources(vaultId: string, callback: RealtimeCallback<any>) {
    const channel = supabase
      .channel(`sources:${vaultId}`)
      .on(
        'postgres_changes' as const,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sources',
          filter: `vault_id=eq.${vaultId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'source_added', payload });
        }
      )
      .on(
        'postgres_changes' as const,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sources',
          filter: `vault_id=eq.${vaultId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'source_updated', payload });
        }
      )
      .on(
        'postgres_changes' as const,
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sources',
          filter: `vault_id=eq.${vaultId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'source_deleted', payload });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to annotation changes for a source
   */
  subscribeToAnnotations(sourceId: string, callback: RealtimeCallback<any>) {
    const channel = supabase
      .channel(`annotations:${sourceId}`)
      .on(
        'postgres_changes' as const,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'annotations',
          filter: `source_id=eq.${sourceId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'annotation_added', payload });
        }
      )
      .on(
        'postgres_changes' as const,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'annotations',
          filter: `source_id=eq.${sourceId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'annotation_updated', payload });
        }
      )
      .on(
        'postgres_changes' as const,
        {
          event: 'DELETE',
          schema: 'public',
          table: 'annotations',
          filter: `source_id=eq.${sourceId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'annotation_deleted', payload });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to vault member changes
   */
  subscribeToMembers(vaultId: string, callback: RealtimeCallback<any>) {
    const channel = supabase
      .channel(`members:${vaultId}`)
      .on(
        'postgres_changes' as const,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vault_members',
          filter: `vault_id=eq.${vaultId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'member_added', payload });
        }
      )
      .on(
        'postgres_changes' as const,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vault_members',
          filter: `vault_id=eq.${vaultId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'member_role_changed', payload });
        }
      )
      .on(
        'postgres_changes' as const,
        {
          event: 'DELETE',
          schema: 'public',
          table: 'vault_members',
          filter: `vault_id=eq.${vaultId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'member_removed', payload });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to activity logs (for audit trail)
   */
  subscribeToActivityLogs(vaultId: string, callback: RealtimeCallback<any>) {
    const channel = supabase
      .channel(`activity:${vaultId}`)
      .on(
        'postgres_changes' as const,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `vault_id=eq.${vaultId}`,
        } as any,
        (payload: any) => {
          callback({ type: 'activity_logged', payload });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
