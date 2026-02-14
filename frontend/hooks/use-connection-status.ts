'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase-client';

/**
 * Monitors the Supabase Realtime WebSocket connection.
 * Returns `true` when connected, `false` when disconnected.
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Create a lightweight presence channel to monitor connection state
    const channel = supabase.channel('connection-status');

    channel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    // Listen for browser online/offline events
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isConnected;
}
