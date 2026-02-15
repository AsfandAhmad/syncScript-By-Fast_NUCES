'use client';

/**
 * Monitors the Supabase Realtime WebSocket connection.
 * Returns `true` when connected, `false` when disconnected.
 *
 * Currently always returns true because the Supabase Realtime publication
 * is not configured yet. To enable:
 * 1. Run: ALTER PUBLICATION supabase_realtime ADD TABLE vaults, sources, annotations, vault_members, files, activity_logs;
 * 2. Restore the channel-based implementation from git history.
 */
export function useConnectionStatus() {
  return true;
}
