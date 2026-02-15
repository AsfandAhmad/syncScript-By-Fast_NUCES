'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from '@/components/notification-item';
import { notificationService } from '@/lib/services/notification.service';
import { useAuth } from '@/hooks/use-auth';
import supabase from '@/lib/supabase-client';
import type { Notification } from '@/lib/database.types';

export function NotificationCenter() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [open, setOpen] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications from the database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await notificationService.getNotifications(50);
      if (result.status === 'success' && result.data) {
        setNotifications(result.data);
      }
    } catch {
      // Table may not exist — silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime notifications for the current user
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications:${user.id}`)
      .on(
        'postgres_changes' as const,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        } as any,
        (payload: any) => {
          // Prepend new notification to list in realtime
          if (payload.new) {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  // Refetch when popover opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const result = await notificationService.markAllAsRead();
      if (result.status === 'success') {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    // Navigate to vault if available
    if (notification.vault_id) {
      setOpen(false);
      router.push(`/vault/${notification.vault_id}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 text-xs"
              disabled={markingAll}
              onClick={handleMarkAllRead}
            >
              {markingAll ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="mr-1 h-3 w-3" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleNotificationClick(n)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
