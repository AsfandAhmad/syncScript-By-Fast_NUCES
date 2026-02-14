'use client';

import {
  Upload, MessageSquare, Edit3, UserPlus, BookOpen,
  FolderPlus, Trash2, Link, Shield, FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ActivityLog, ACTION_LABELS } from '@/lib/database.types';

const categoryIcons: Record<string, React.ElementType> = {
  vault: FolderPlus,
  source: Link,
  annotation: MessageSquare,
  file: Upload,
  member: UserPlus,
  default: Edit3,
};

const categoryColors: Record<string, string> = {
  vault: 'text-primary',
  source: 'text-blue-600',
  annotation: 'text-amber-600',
  file: 'text-emerald-600',
  member: 'text-violet-600',
  default: 'text-muted-foreground',
};

interface ActivityFeedProps {
  items: ActivityLog[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, index) => {
        const info = ACTION_LABELS[item.action_type] || { label: item.action_type, category: 'default' };
        const Icon = categoryIcons[info.category] || categoryIcons.default;
        const iconColor = categoryColors[info.category] || categoryColors.default;
        const initials = item.metadata?.actor_email
          ? item.metadata.actor_email.substring(0, 2).toUpperCase()
          : item.actor_id?.substring(0, 2).toUpperCase() || '??';
        const targetName = item.metadata?.title || item.metadata?.file_name || item.metadata?.name || '';

        return (
          <div key={item.id} className="relative flex gap-3 py-2">
            {index < items.length - 1 && (
              <div className="absolute left-[13px] top-9 h-[calc(100%-12px)] w-px bg-border" />
            )}
            <Avatar className="mt-0.5 h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-foreground">
                <span className="text-muted-foreground">{info.label}</span>
                {targetName && (
                  <>
                    {' '}
                    <span className="font-medium">{targetName}</span>
                  </>
                )}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className={`h-3 w-3 ${iconColor}`} />
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
