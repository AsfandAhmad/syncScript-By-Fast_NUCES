'use client';

import { UserPlus, FileUp, FileText, MessageSquare } from 'lucide-react';
import type { Notification, NotificationType } from '@/lib/database.types';
import { cn } from '@/lib/utils';

const iconMap: Record<NotificationType, React.ReactNode> = {
  member_added: <UserPlus className="h-4 w-4 text-blue-500" />,
  source_added: <FileText className="h-4 w-4 text-green-500" />,
  annotation_added: <MessageSquare className="h-4 w-4 text-purple-500" />,
  file_uploaded: <FileUp className="h-4 w-4 text-orange-500" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted/80',
        !notification.read && 'bg-primary/5'
      )}
      onClick={onClick}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        {iconMap[notification.type] || <FileText className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm truncate', !notification.read && 'font-semibold')}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
        <p className="text-[11px] text-muted-foreground/70">{timeAgo(notification.created_at)}</p>
      </div>
    </button>
  );
}
