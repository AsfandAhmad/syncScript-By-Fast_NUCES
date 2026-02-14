'use client';

import { ExternalLink, FileText, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Source } from '@/lib/database.types';

interface SourceItemProps {
  source: Source;
  onClick?: () => void;
  onDelete?: (sourceId: string) => Promise<void>;
}

export function SourceItem({ source, onClick, onDelete }: SourceItemProps) {
  return (
    <div
      className="group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <FileText className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-sm">
          {source.title || 'Untitled Source'}
        </p>
        <p className="truncate text-xs text-muted-foreground">{source.url}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            window.open(source.url, '_blank');
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(source.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}
