'use client';

import { useEffect, useState, useCallback } from 'react';
import { realtimeService } from '@/lib/services/realtime.service';
import { Source } from '@/lib/database.types';

/**
 * Hook for real-time source updates
 */
export function useRealtimeSources(vaultId: string) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToSources(vaultId, (data) => {
      if (data.type === 'source_added') {
        setSources((prev) => [data.payload.new, ...prev]);
      } else if (data.type === 'source_updated') {
        setSources((prev) =>
          prev.map((s) => (s.id === data.payload.new.id ? data.payload.new : s))
        );
      } else if (data.type === 'source_deleted') {
        setSources((prev) => prev.filter((s) => s.id !== data.payload.old.id));
      }
    });

    setLoading(false);
    return unsubscribe;
  }, [vaultId]);

  return { sources, loading, error };
}

/**
 * Hook for real-time vault member updates
 */
export function useRealtimeMembers(vaultId: string) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToMembers(vaultId, (data) => {
      if (data.type === 'member_added') {
        setMembers((prev) => [...prev, data.payload.new]);
      } else if (data.type === 'member_role_changed') {
        setMembers((prev) =>
          prev.map((m) => (m.id === data.payload.new.id ? data.payload.new : m))
        );
      } else if (data.type === 'member_removed') {
        setMembers((prev) => prev.filter((m) => m.id !== data.payload.old.id));
      }
    });

    setLoading(false);
    return unsubscribe;
  }, [vaultId]);

  return { members, loading };
}

/**
 * Hook for real-time activity feed
 */
export function useRealtimeActivityLog(vaultId: string) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToActivityLogs(vaultId, (data) => {
      if (data.type === 'activity_logged') {
        setActivities((prev) => [data.payload.new, ...prev]);
      }
    });

    setLoading(false);
    return unsubscribe;
  }, [vaultId]);

  return { activities, loading };
}

/**
 * Hook for real-time annotation updates
 */
export function useRealtimeAnnotations(sourceId: string) {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToAnnotations(sourceId, (data) => {
      if (data.type === 'annotation_added') {
        setAnnotations((prev) => [...prev, data.payload.new]);
      } else if (data.type === 'annotation_updated') {
        setAnnotations((prev) =>
          prev.map((a) => (a.id === data.payload.new.id ? data.payload.new : a))
        );
      } else if (data.type === 'annotation_deleted') {
        setAnnotations((prev) => prev.filter((a) => a.id !== data.payload.old.id));
      }
    });

    setLoading(false);
    return unsubscribe;
  }, [sourceId]);

  return { annotations, loading };
}
