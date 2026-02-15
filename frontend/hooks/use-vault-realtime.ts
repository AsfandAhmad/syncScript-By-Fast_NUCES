'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import supabase from '@/lib/supabase-client';

/** Supported table names for vault realtime subscriptions */
type VaultTable = 'vaults' | 'sources' | 'annotations' | 'vault_members';

/** Event types from Supabase Realtime */
type EventType = 'INSERT' | 'UPDATE' | 'DELETE';

/** Payload returned by the hook on each realtime change */
export interface VaultRealtimeChange {
  /** The table that changed */
  table: VaultTable;
  /** INSERT, UPDATE, or DELETE */
  eventType: EventType;
  /** The new row data (null on DELETE) */
  newRecord: Record<string, any> | null;
  /** The old row data (partial, available on UPDATE/DELETE) */
  oldRecord: Record<string, any> | null;
  /** ISO timestamp of when the change was received */
  receivedAt: string;
}

/**
 * useVaultRealtime – unified realtime hook for a vault
 *
 * Subscribes to postgres_changes on vaults, sources, annotations,
 * and vault_members filtered by vault_id. Automatically cleans up
 * on unmount or when vaultId changes.
 *
 * @param vaultId - The vault UUID to subscribe to
 * @returns The latest realtime change (or null if none received yet)
 *
 * @example
 * ```tsx
 * const change = useVaultRealtime(vaultId);
 * useEffect(() => {
 *   if (change?.table === 'sources' && change.eventType === 'INSERT') {
 *     // handle new source
 *   }
 * }, [change]);
 * ```
 */
export function useVaultRealtime(vaultId: string | undefined) {
  const [latestChange, setLatestChange] = useState<VaultRealtimeChange | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleChange = useCallback(
    (table: VaultTable, eventType: EventType, payload: any) => {
      setLatestChange({
        table,
        eventType,
        newRecord: payload.new ?? null,
        oldRecord: payload.old ?? null,
        receivedAt: new Date().toISOString(),
      });
    },
    []
  );

  useEffect(() => {
    if (!vaultId) return;

    // Build a single channel with multiple listeners
    const channel = supabase
      .channel(`vault-realtime:${vaultId}`)
      // --- vaults table (filter by id) ---
      .on(
        'postgres_changes' as const,
        { event: 'UPDATE', schema: 'public', table: 'vaults', filter: `id=eq.${vaultId}` } as any,
        (p: any) => handleChange('vaults', 'UPDATE', p)
      )
      .on(
        'postgres_changes' as const,
        { event: 'DELETE', schema: 'public', table: 'vaults', filter: `id=eq.${vaultId}` } as any,
        (p: any) => handleChange('vaults', 'DELETE', p)
      )
      // --- sources table ---
      .on(
        'postgres_changes' as const,
        { event: 'INSERT', schema: 'public', table: 'sources', filter: `vault_id=eq.${vaultId}` } as any,
        (p: any) => handleChange('sources', 'INSERT', p)
      )
      .on(
        'postgres_changes' as const,
        { event: 'UPDATE', schema: 'public', table: 'sources', filter: `vault_id=eq.${vaultId}` } as any,
        (p: any) => handleChange('sources', 'UPDATE', p)
      )
      .on(
        'postgres_changes' as const,
        { event: 'DELETE', schema: 'public', table: 'sources', filter: `vault_id=eq.${vaultId}` } as any,
        (p: any) => handleChange('sources', 'DELETE', p)
      )
      // --- annotations table (via sources in this vault) ---
      .on(
        'postgres_changes' as const,
        { event: 'INSERT', schema: 'public', table: 'annotations' } as any,
        (p: any) => handleChange('annotations', 'INSERT', p)
      )
      .on(
        'postgres_changes' as const,
        { event: 'UPDATE', schema: 'public', table: 'annotations' } as any,
        (p: any) => handleChange('annotations', 'UPDATE', p)
      )
      .on(
        'postgres_changes' as const,
        { event: 'DELETE', schema: 'public', table: 'annotations' } as any,
        (p: any) => handleChange('annotations', 'DELETE', p)
      )
      // --- vault_members table ---
      .on(
        'postgres_changes' as const,
        { event: 'INSERT', schema: 'public', table: 'vault_members', filter: `vault_id=eq.${vaultId}` } as any,
        (p: any) => handleChange('vault_members', 'INSERT', p)
      )
      .on(
        'postgres_changes' as const,
        { event: 'UPDATE', schema: 'public', table: 'vault_members', filter: `vault_id=eq.${vaultId}` } as any,
        (p: any) => handleChange('vault_members', 'UPDATE', p)
      )
      .on(
        'postgres_changes' as const,
        { event: 'DELETE', schema: 'public', table: 'vault_members', filter: `vault_id=eq.${vaultId}` } as any,
        (p: any) => handleChange('vault_members', 'DELETE', p)
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount or vaultId change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [vaultId, handleChange]);

  return latestChange;
}

export default useVaultRealtime;
