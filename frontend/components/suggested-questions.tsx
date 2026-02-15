'use client';

import { Button } from '@/components/ui/button';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  'Summarize all sources in this vault',
  'What are the key topics discussed?',
  'List all annotations with their authors',
  'What files have been uploaded?',
  'What are the most important findings?',
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="text-center">
        <p className="text-lg font-semibold">💬 SyncBot</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask me anything about this vault&apos;s content
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((q) => (
          <Button
            key={q}
            variant="outline"
            size="sm"
            className="h-auto whitespace-normal px-3 py-2 text-xs"
            onClick={() => onSelect(q)}
          >
            {q}
          </Button>
        ))}
      </div>
    </div>
  );
}
