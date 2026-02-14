'use client';

import {
  Upload,
  MessageSquare,
  Edit3,
  UserPlus,
  BookOpen,
  Trash2,
  FileText,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ActivityLogWithActor } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';

const actionTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  source_created: { icon: BookOpen, color: 'text-blue-600', label: 'added a new source' },
  source_updated: { icon: Edit3, color: 'text-blue-600', label: 'updated a source' },
  source_deleted: { icon: Trash2, color: 'text-red-600', label: 'removed a source' },
  annotation_created: { icon: MessageSquare, color: 'text-amber-600', label: 'added an annotation' },
  annotation_updated: { icon: Edit3, color: 'text-amber-600', label: 'edited an annotation' },
  annotation_deleted: { icon: Trash2, color: 'text-red-600', label: 'removed an annotation' },
  file_uploaded: { icon: Upload, color: 'text-emerald-600', label: 'uploaded a file' },
  file_deleted: { icon: Trash2, color: 'text-red-600', label: 'removed a file' },
  member_added: { icon: UserPlus, color: 'text-blue-600', label: 'added a member' },
  member_removed: { icon: Trash2, color: 'text-red-600', label: 'removed a member' },
  member_role_changed: { icon: Edit3, color: 'text-blue-600', label: "changed a member's role" },
};

function getInitials(name?: string, email?: string): string {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

function getTarget(metadata: Record<string, any>, actionType: string): string {
  if (metadata?.source_title) return metadata.source_title;
  if (metadata?.file_name) return metadata.file_name;
  if (metadata?.annotation_id) return 'annotation';
  return '';
}

interface ActivityFeedProps {
  items: ActivityLogWithActor[];
  maxItems?: number;
}

export function ActivityFeed({ items, maxItems }: ActivityFeedProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  if (displayItems.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {displayItems.map((item, index) => {
        const config = actionTypeConfig[item.action_type] || {
          icon: FileText,
          color: 'text-gray-600',
          label: item.action_type.replace(/_/g, ' '),
        };
        const Icon = config.icon;
        const displayName = item.actor_name || item.actor_email || 'Someone';
        const initials = getInitials(item.actor_name, item.actor_email);
        const target = getTarget(item.metadata || {}, item.action_type);
        const timeAgo = item.timestamp
          ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })
          : '';

        return (
          <div key={item.id} className="relative flex gap-3 py-2">
            {index < displayItems.length - 1 && (
              <div className="absolute left-[13px] top-9 h-[calc(100%-12px)] w-px bg-border" />
            )}
            <Avatar className="mt-0.5 h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-foreground">
                <span className="font-medium">{displayName}</span>{' '}
                <span className="text-muted-foreground">{config.label}</span>
                {target && (
                  <>
                    {' '}<span className="font-medium">{target}</span>
                  </>
                )}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className={`h-3 w-3 ${config.color}`} />
                {timeAgo}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
