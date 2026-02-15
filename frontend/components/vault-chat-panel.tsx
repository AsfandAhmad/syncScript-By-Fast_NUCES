'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Loader2, DatabaseZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessageBubble } from '@/components/chat-message';
import { CitationCard } from '@/components/citation-card';
import { SuggestedQuestions } from '@/components/suggested-questions';
import { chatService } from '@/lib/services/chat.service';
import { toast } from 'sonner';
import type { ChatCitation, ChatMessage } from '@/lib/database.types';

interface VaultChatPanelProps {
  vaultId: string;
  vaultName: string;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
  timestamp?: string;
  isStreaming?: boolean;
}

export function VaultChatPanel({ vaultId, vaultName }: VaultChatPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history on mount
  useEffect(() => {
    if (historyLoaded) return;
    (async () => {
      try {
        const { messages: history, conversationId: convId } =
          await chatService.getHistory(vaultId);

        if (history.length > 0) {
          setMessages(
            history
              .filter((m: ChatMessage) => m.role !== 'system')
              .map((m: ChatMessage) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                citations: m.citations || [],
                timestamp: m.created_at,
              }))
          );
        }
        if (convId) setConversationId(convId);
      } catch {
        // Silently fail on history load
      }
      setHistoryLoaded(true);
    })();
  }, [vaultId, historyLoaded]);

  const handleSend = useCallback(
    async (question?: string) => {
      const q = (question || input).trim();
      if (!q || isLoading) return;

      setInput('');

      // Add user message
      const userMsg: DisplayMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: q,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add streaming assistant placeholder
      const botId = `bot-${Date.now()}`;
      const botMsg: DisplayMessage = {
        id: botId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);

      setIsLoading(true);

      await chatService.sendMessage(vaultId, q, conversationId, {
        onText: (text) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, content: m.content + text } : m
            )
          );
        },
        onCitations: (citations, convId) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, citations } : m
            )
          );
          if (convId) setConversationId(convId);
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, isStreaming: false } : m
            )
          );
          setIsLoading(false);
        },
        onError: (error) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? { ...m, content: `Error: ${error}`, isStreaming: false }
                : m
            )
          );
          setIsLoading(false);
          toast.error('Chat error: ' + error);
        },
      });
    },
    [input, isLoading, vaultId, conversationId]
  );

  const handleIndexVault = async () => {
    setIsIndexing(true);
    try {
      const result = await chatService.indexVault(vaultId);
      if (result.success && result.stats) {
        const { totalChunks, indexedSources, indexedAnnotations, indexedFiles, skippedAlreadyIndexed, message } = result.stats;
        setIsIndexed(true);
        if (totalChunks === 0 && skippedAlreadyIndexed) {
          toast.success(`All content is already indexed (${skippedAlreadyIndexed} items)`);
        } else {
          toast.success(
            `Indexed ${totalChunks} chunks from ${indexedSources} sources, ${indexedAnnotations} annotations, ${indexedFiles} files${skippedAlreadyIndexed ? ` (${skippedAlreadyIndexed} already indexed)` : ''}`
          );
        }
      } else {
        toast.error(result.error || 'Indexing failed');
      }
    } catch {
      toast.error('Failed to index vault content');
    } finally {
      setIsIndexing(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatService.clearHistory(vaultId);
      setMessages([]);
      setConversationId(null);
      toast.success('Chat history cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get the last assistant message's citations for the CitationCard
  const lastBotMsg = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isStreaming);
  const lastCitations = lastBotMsg?.citations || [];

  return (
    <div className="flex h-[calc(100vh-280px)] min-h-[400px] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-1 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">💬 SyncBot</span>
          <span className="text-xs text-muted-foreground">
            Ask about &quot;{vaultName}&quot;
          </span>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={handleClearHistory}
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Index banner — show when no messages yet and not indexed */}
      {messages.length === 0 && !isIndexed && (
        <div className="mx-2 mt-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950">
          <DatabaseZap className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="flex-1 text-xs text-blue-700 dark:text-blue-300">
            Index this vault&apos;s content so SyncBot can answer questions about your sources, annotations, and files.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0 gap-1 text-xs"
            onClick={handleIndexVault}
            disabled={isIndexing}
          >
            {isIndexing ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Indexing...</>
            ) : (
              <><DatabaseZap className="h-3 w-3" /> Index Vault</>
            )}
          </Button>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-3">
        {messages.length === 0 ? (
          <SuggestedQuestions onSelect={(q) => handleSend(q)} />
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                citations={msg.citations}
                isStreaming={msg.isStreaming}
                timestamp={msg.timestamp}
              />
            ))}
            {/* Citations shown inline at bottom of scroll */}
            {lastCitations.length > 0 && (
              <div className="mt-2 px-1">
                <CitationCard citations={lastCitations} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t px-2 py-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this vault..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
