'use client';

import { FileText, Link, MessageSquare } from 'lucide-react';
import type { ChatCitation } from '@/lib/database.types';

interface CitationCardProps {
  citations: ChatCitation[];
}

const typeIcons: Record<string, React.ElementType> = {
  source: Link,
  annotation: MessageSquare,
  file: FileText,
};

export function CitationCard({ citations }: CitationCardProps) {
  if (citations.length === 0) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        📎 Sources referenced ({citations.length})
      </p>
      <div className="flex flex-col gap-1.5">
        {citations.map((c, i) => {
          const Icon = typeIcons[c.source_type] || FileText;
          return (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md bg-background px-2.5 py-1.5 text-xs"
            >
              <Icon className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <span className="font-medium text-foreground">
                  [{i + 1}] {c.title}
                </span>
                <span className="ml-1.5 text-muted-foreground">({c.source_type})</span>
                {c.snippet && (
                  <p className="mt-0.5 truncate text-muted-foreground">{c.snippet}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
