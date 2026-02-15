'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/use-connection-status';

/**
 * Subtle banner that appears when the real-time connection is lost.
 * Displays inline, typically placed just below a sticky header.
 */
export function ConnectionStatus() {
  const isConnected = useConnectionStatus();

  if (isConnected) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-yellow-500/15 px-4 py-1.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
      <WifiOff className="h-3.5 w-3.5" />
      Reconnecting to real-time updates…
    </div>
  );
}
