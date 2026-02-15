'use client';

import { useEffect, useState } from 'react';
import { Source, Annotation, VaultMember, ActivityLog, FileRecord, Notification } from '@/lib/database.types';

/**
 * Realtime hooks — currently operate in "poll" mode (no WebSocket subscriptions).
 *
 * To enable live updates later:
 * 1. Run the SQL in supabase/migrations/ to add tables to `supabase_realtime` publication
 * 2. Uncomment the useEffect blocks that call realtimeService.subscribe*()
 * 3. Import realtimeService again
 */

export function useRealtimeSources(vaultId: string, initial: Source[] = []) {
  const [sources, setSources] = useState<Source[]>(initial);

  useEffect(() => {
    setSources(initial);
  }, [initial]);

  return { sources, setSources };
}

export function useRealtimeMembers(vaultId: string, initial: VaultMember[] = []) {
  const [members, setMembers] = useState<VaultMember[]>(initial);

  useEffect(() => {
    setMembers(initial);
  }, [initial]);

  return { members, setMembers };
}

export function useRealtimeActivity(vaultId: string, initial: ActivityLog[] = []) {
  const [activities, setActivities] = useState<ActivityLog[]>(initial);

  useEffect(() => {
    setActivities(initial);
  }, [initial]);

  return { activities, setActivities };
}

export function useRealtimeAnnotations(sourceId: string, initial: Annotation[] = []) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initial);

  useEffect(() => {
    setAnnotations(initial);
  }, [initial]);

  return { annotations, setAnnotations };
}

export function useRealtimeFiles(vaultId: string, initial: FileRecord[] = []) {
  const [files, setFiles] = useState<FileRecord[]>(initial);

  useEffect(() => {
    setFiles(initial);
  }, [initial]);

  return { files, setFiles };
}

export function useRealtimeNotifications(userId: string | undefined, initial: Notification[] = []) {
  const [notifications, setNotifications] = useState<Notification[]>(initial);

  useEffect(() => {
    setNotifications(initial);
  }, [initial]);

  return { notifications, setNotifications };
}
