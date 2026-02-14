'use client';

import {
  Upload,
  MessageSquare,
  Edit3,
  UserPlus,
  BookOpen,
  MessageCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ActivityLog } from '@/lib/database.types';

const typeIcons: Record<string, React.ElementType> = {
  upload: Upload,
  annotation: MessageSquare,
  comment: MessageCircle,
  edit: Edit3,
  member: UserPlus,
  citation: BookOpen,
};

const typeColors: Record<string, string> = {
  upload: 'text-blue-600',
  annotation: 'text-amber-600',
  comment: 'text-emerald-600',
  edit: 'text-blue-600',
  member: 'text-blue-600',
  citation: 'text-blue-600',
};

interface ActivityFeedProps {
  items: ActivityLog[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, index) => {
        const Icon = typeIcons[item.type]
        const iconColor = typeColors[item.type]
        return (
          <div key={item.id} className="relative flex gap-3 py-2">
            {/* Timeline line */}
            {index < items.length - 1 && (
              <div className="absolute left-[13px] top-9 h-[calc(100%-12px)] w-px bg-border" />
            )}
            <Avatar className="mt-0.5 h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                {item.avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-foreground">
                <span className="font-medium">{item.user}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>{" "}
                <span className="font-medium">{item.target}</span>
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className={`h-3 w-3 ${iconColor}`} />
                {item.timestamp}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
