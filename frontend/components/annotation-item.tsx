'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { AnnotationWithAuthor } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';

interface AnnotationItemProps {
  annotation: AnnotationWithAuthor;
  currentUserId?: string;
  userRole?: 'owner' | 'contributor' | 'viewer';
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}

function getInitials(name?: string, email?: string): string {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

export function AnnotationItem({ annotation, currentUserId, userRole, onEdit, onDelete }: AnnotationItemProps) {
  const displayName = annotation.author_name || annotation.author_email || 'Unknown';
  const initials = getInitials(annotation.author_name, annotation.author_email);
  const timeAgo = annotation.created_at
    ? formatDistanceToNow(new Date(annotation.created_at), { addSuffix: true })
    : '';
  const canEdit = currentUserId === annotation.created_by || userRole === 'owner';
  const canDelete = currentUserId === annotation.created_by || userRole === 'owner';

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
        <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {displayName}
          </span>
          {annotation.version > 1 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              v{annotation.version}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {annotation.content}
        </p>
        {(canEdit || canDelete) && (
          <div className="mt-2 flex items-center gap-1">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(annotation.id, annotation.content)}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(annotation.id)}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
