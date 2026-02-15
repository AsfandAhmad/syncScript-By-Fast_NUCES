/**
 * Prompt builder for RAG chatbot.
 */

import type { ChatMessage } from '@/lib/database.types';

/**
 * Build the system prompt with context chunks and vault metadata injected.
 */
export function buildSystemPrompt(vaultName: string, contextText: string, membersText?: string): string {
  let membersSection = '';
  if (membersText) {
    membersSection = `\n\nVault Members:\n${membersText}\n`;
  }

  return `You are SyncBot, an intelligent research assistant for the SyncScript academic collaboration platform.
You are currently helping inside the vault "${vaultName}".
${membersSection}
Your job is to answer the user's questions using the provided context from the vault's sources, annotations, files, and member information. If the context does not contain enough information to answer, say so clearly — do NOT make up information.

Rules:
1. Always cite your sources using [Source N] notation matching the numbered sources below.
2. Keep answers concise but thorough.
3. If multiple sources discuss the same topic, synthesize them.
4. When the user asks about members, use the Vault Members list above.
5. When the user asks about a specific member's contributions, filter by author.
6. Use markdown formatting for readability (bullet points, bold, headers).
7. If the question is unrelated to the vault content, politely redirect.
8. Be helpful, accurate, and grounded in the provided context only.

Context from vault (retrieved via similarity search):
---
${contextText}
---`;
}

/**
 * Build the messages array for the Gemini chat API,
 * including conversation history.
 */
export function buildMessages(
  systemPrompt: string,
  history: ChatMessage[],
  userQuestion: string,
  maxHistoryMessages = 6
): { role: string; content: string }[] {
  const messages: { role: string; content: string }[] = [];

  // System instruction
  messages.push({ role: 'system', content: systemPrompt });

  // Recent conversation history (last N messages)
  const recent = history.slice(-maxHistoryMessages);
  for (const msg of recent) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Current user question
  messages.push({ role: 'user', content: userQuestion });

  return messages;
}
