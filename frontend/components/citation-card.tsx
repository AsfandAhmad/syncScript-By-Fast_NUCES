'use client';

import { useState } from 'react';
import { FileText, Link, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [isExpanded, setIsExpanded] = useState(false);

  if (citations.length === 0) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>📎 Sources referenced ({citations.length})</span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {isExpanded && (
        <div className="mt-2 flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
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
      )}
    </div>
  );
}
