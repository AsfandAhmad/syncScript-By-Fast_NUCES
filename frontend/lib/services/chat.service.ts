/**
 * Client-side chat service for the RAG chatbot.
 */

import type { ChatMessage, ChatCitation } from '@/lib/database.types';

export interface StreamCallbacks {
  onText: (text: string) => void;
  onCitations: (citations: ChatCitation[], conversationId: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

class ChatService {
  /**
   * Send a message and stream the response via SSE.
   */
  async sendMessage(
    vaultId: string,
    question: string,
    conversationId: string | null,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vaultId, question, conversationId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Chat request failed' }));
      callbacks.onError(err.error || 'Chat request failed');
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      callbacks.onError('No response stream');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(trimmed.slice(6));

          switch (data.type) {
            case 'text':
              callbacks.onText(data.content);
              break;
            case 'citations':
              callbacks.onCitations(data.citations || [], data.conversationId || '');
              break;
            case 'done':
              callbacks.onDone();
              break;
            case 'error':
              callbacks.onError(data.content);
              break;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  /**
   * Get chat history for a vault.
   */
  async getHistory(vaultId: string): Promise<{ messages: ChatMessage[]; conversationId: string | null }> {
    const res = await fetch(`/api/chat/history?vaultId=${vaultId}`);
    if (!res.ok) return { messages: [], conversationId: null };

    const json = await res.json();
    return {
      messages: json.data || [],
      conversationId: json.conversationId || null,
    };
  }

  /**
   * Clear chat history for a vault.
   */
  async clearHistory(vaultId: string): Promise<void> {
    await fetch(`/api/chat/history?vaultId=${vaultId}`, { method: 'DELETE' });
  }

  /**
   * Trigger embedding index for a content item (fire-and-forget).
   */
  async indexContent(
    vaultId: string,
    sourceType: 'source' | 'annotation' | 'file',
    sourceId: string,
    action: 'upsert' | 'delete' = 'upsert'
  ): Promise<void> {
    try {
      await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId, sourceType, sourceId, action }),
      });
    } catch {
      // Fire-and-forget — don't block on embedding errors
    }
  }
}

export const chatService = new ChatService();
