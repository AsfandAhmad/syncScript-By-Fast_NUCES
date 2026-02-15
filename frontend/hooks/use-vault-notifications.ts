'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useVaultRealtime, VaultRealtimeChange } from './use-vault-realtime';

/**
 * Notification messages keyed by `table:eventType`.
 * Provides human-readable toast messages for every realtime event.
 */
const NOTIFICATION_MAP: Record<string, { title: string; description?: string; variant: 'success' | 'info' | 'warning' }> = {
  'sources:INSERT':       { title: '📄 New source added',       description: 'A new source was added to the vault.',     variant: 'success' },
  'sources:UPDATE':       { title: '📝 Source updated',          description: 'A source was updated.',                    variant: 'info' },
  'sources:DELETE':       { title: '🗑️ Source removed',          description: 'A source was removed from the vault.',     variant: 'warning' },
  'annotations:INSERT':   { title: '💬 New annotation',          description: 'An annotation was added.',                 variant: 'success' },
  'annotations:UPDATE':   { title: '✏️ Annotation updated',      description: 'An annotation was edited.',                variant: 'info' },
  'annotations:DELETE':   { title: '🗑️ Annotation removed',      description: 'An annotation was deleted.',               variant: 'warning' },
  'vault_members:INSERT': { title: '👤 Contributor added',       description: 'A new member joined the vault.',           variant: 'success' },
  'vault_members:UPDATE': { title: '🔄 Role updated',            description: 'A member\'s role was changed.',            variant: 'info' },
  'vault_members:DELETE': { title: '👤 Member removed',          description: 'A member was removed from the vault.',     variant: 'warning' },
  'vaults:UPDATE':        { title: '📁 Vault updated',           description: 'The vault details were modified.',         variant: 'info' },
  'vaults:DELETE':        { title: '⚠️ Vault deleted',            description: 'This vault has been deleted.',             variant: 'warning' },
};

/**
 * Show a toast notification for a realtime change.
 */
function notifyChange(change: VaultRealtimeChange) {
  const key = `${change.table}:${change.eventType}`;
  const notification = NOTIFICATION_MAP[key];

  if (!notification) return;

  // Build a richer description when we have row data
  let description = notification.description;
  if (change.table === 'sources' && change.newRecord?.title) {
    description = `"${change.newRecord.title}"`;
  }
  if (change.table === 'vault_members' && change.newRecord?.role) {
    description = `Role: ${change.newRecord.role}`;
  }

  switch (notification.variant) {
    case 'success':
      toast.success(notification.title, { description });
      break;
    case 'warning':
      toast.warning(notification.title, { description });
      break;
    default:
      toast.info(notification.title, { description });
  }
}

/**
 * useVaultNotifications – in-app toast notifications for vault realtime events
 *
 * Wraps `useVaultRealtime` and fires sonner toast notifications
 * whenever a change is received. Drop this into any vault page.
 *
 * @param vaultId - The vault UUID to watch
 *
 * @example
 * ```tsx
 * useVaultNotifications(vaultId);
 * ```
 */
export function useVaultNotifications(vaultId: string | undefined) {
  const latestChange = useVaultRealtime(vaultId);

  useEffect(() => {
    if (latestChange) {
      notifyChange(latestChange);
    }
  }, [latestChange]);

  return latestChange;
}

export default useVaultNotifications;
