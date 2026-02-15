'use client';

import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import type { ChatCitation } from '@/lib/database.types';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
  isStreaming?: boolean;
  timestamp?: string;
}

export function ChatMessageBubble({
  role,
  content,
  citations,
  isStreaming,
  timestamp,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isBot = role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 py-3', isBot ? 'flex-row' : 'flex-row-reverse')}>
      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
        <AvatarFallback
          className={cn(
            'text-[10px]',
            isBot ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex max-w-[80%] flex-col gap-1', !isBot && 'items-end')}>
        <div
          className={cn(
            'rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
            isBot
              ? 'bg-muted/60 text-foreground'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {isBot ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              {isStreaming && (
                <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-primary" />
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>

        {/* Citations */}
        {isBot && citations && citations.length > 0 && !isStreaming && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {citations.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-400/20"
                title={c.snippet}
              >
                [{i + 1}] {c.title?.slice(0, 30)}{c.title && c.title.length > 30 ? '…' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 px-1">
          {timestamp && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {isBot && content && !isStreaming && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCopy}
              title="Copy"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
