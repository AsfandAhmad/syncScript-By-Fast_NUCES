'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeIndicatorProps {
  className?: string;
}

export function RealtimeIndicator({ className }: RealtimeIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        isOnline ? 'text-emerald-600' : 'text-red-500',
        className
      )}
    >
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
        )}
      />
      {isOnline ? (
        <span className="hidden sm:inline">Live</span>
      ) : (
        <span className="hidden sm:inline">Offline</span>
      )}
    </div>
  );
}
