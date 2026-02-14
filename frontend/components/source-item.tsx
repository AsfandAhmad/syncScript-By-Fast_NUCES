'use client';

import { ExternalLink, Link2, FileText, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Source } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SourceItemProps {
  source: Source;
  isSelected?: boolean;
  userRole?: 'owner' | 'contributor' | 'viewer';
  currentUserId?: string;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SourceItem({ source, isSelected, userRole, currentUserId, onSelect, onDelete }: SourceItemProps) {
  const isUrl = source.url && source.url.startsWith('http');
  const timeAgo = source.created_at
    ? formatDistanceToNow(new Date(source.created_at), { addSuffix: true })
    : '';
  const canDelete = userRole === 'owner' || (userRole === 'contributor' && currentUserId === source.created_by);

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 transition-colors cursor-pointer',
        isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-border hover:border-blue-300'
      )}
      onClick={() => onSelect?.(source.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {isUrl ? (
            <Link2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
          ) : (
            <FileText className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium leading-snug text-foreground truncate">
              {source.title || source.url || 'Untitled Source'}
            </h4>
            {source.url && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {source.url}
              </p>
            )}
            {source.metadata?.author && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                By {source.metadata.author}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {source.version > 1 && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              v{source.version}
            </Badge>
          )}
          {isUrl && source.url && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
              <a href={source.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(source.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{timeAgo}</p>
    </div>
  );
}
