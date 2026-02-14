'use client';

import { useEffect, useState } from 'react';
import { realtimeService } from '@/lib/services/realtime.service';
import { Source, Annotation, VaultMember, ActivityLog, FileRecord, Notification } from '@/lib/database.types';

export function useRealtimeSources(vaultId: string, initial: Source[] = []) {
  const [sources, setSources] = useState<Source[]>(initial);

  useEffect(() => {
    setSources(initial);
  }, [initial]);

  useEffect(() => {
    if (!vaultId) return;
    const unsub = realtimeService.subscribeToSources(vaultId, (data) => {
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
    return unsub;
  }, [vaultId]);

  return { sources, setSources };
}

export function useRealtimeMembers(vaultId: string, initial: VaultMember[] = []) {
  const [members, setMembers] = useState<VaultMember[]>(initial);

  useEffect(() => {
    setMembers(initial);
  }, [initial]);

  useEffect(() => {
    if (!vaultId) return;
    const unsub = realtimeService.subscribeToMembers(vaultId, (data) => {
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
    return unsub;
  }, [vaultId]);

  return { members, setMembers };
}

export function useRealtimeActivity(vaultId: string, initial: ActivityLog[] = []) {
  const [activities, setActivities] = useState<ActivityLog[]>(initial);

  useEffect(() => {
    setActivities(initial);
  }, [initial]);

  useEffect(() => {
    if (!vaultId) return;
    const unsub = realtimeService.subscribeToActivityLogs(vaultId, (data) => {
      if (data.type === 'activity_logged') {
        setActivities((prev) => [data.payload.new, ...prev]);
      }
    });
    return unsub;
  }, [vaultId]);

  return { activities, setActivities };
}

export function useRealtimeAnnotations(sourceId: string, initial: Annotation[] = []) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initial);

  useEffect(() => {
    setAnnotations(initial);
  }, [initial]);

  useEffect(() => {
    if (!sourceId) return;
    const unsub = realtimeService.subscribeToAnnotations(sourceId, (data) => {
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
    return unsub;
  }, [sourceId]);

  return { annotations, setAnnotations };
}

export function useRealtimeFiles(vaultId: string, initial: FileRecord[] = []) {
  const [files, setFiles] = useState<FileRecord[]>(initial);

  useEffect(() => {
    setFiles(initial);
  }, [initial]);

  useEffect(() => {
    if (!vaultId) return;
    const unsub = realtimeService.subscribeToFiles(vaultId, (data) => {
      if (data.type === 'file_uploaded') {
        setFiles((prev) => [data.payload.new, ...prev]);
      } else if (data.type === 'file_deleted') {
        setFiles((prev) => prev.filter((f) => f.id !== data.payload.old.id));
      }
    });
    return unsub;
  }, [vaultId]);

  return { files, setFiles };
}

export function useRealtimeNotifications(userId: string | undefined, initial: Notification[] = []) {
  const [notifications, setNotifications] = useState<Notification[]>(initial);

  useEffect(() => {
    setNotifications(initial);
  }, [initial]);

  useEffect(() => {
    if (!userId) return;
    const unsub = realtimeService.subscribeToNotifications(userId, (data) => {
      if (data.type === 'notification_received') {
        setNotifications((prev) => [data.payload.new, ...prev]);
      } else if (data.type === 'notification_updated') {
        setNotifications((prev) =>
          prev.map((n) => (n.id === data.payload.new.id ? data.payload.new : n))
        );
      } else if (data.type === 'notification_deleted') {
        setNotifications((prev) => prev.filter((n) => n.id !== data.payload.old.id));
      }
    });
    return unsub;
  }, [userId]);

  return { notifications, setNotifications };
}
