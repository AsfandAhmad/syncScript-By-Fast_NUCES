/**
 * Prompt builder for RAG chatbot.
 */

import type { ChatMessage } from '@/lib/database.types';

/**
 * Build the system prompt with context chunks and vault metadata injected.
 */
export function buildSystemPrompt(
  vaultName: string,
  contextText: string,
  membersText?: string,
  vaultInfoText?: string
): string {
  let vaultSection = '';
  if (vaultInfoText) {
    vaultSection = `\n\nVault Details:\n${vaultInfoText}\n`;
  }

  let membersSection = '';
  if (membersText) {
    membersSection = `\n\nVault Members:\n${membersText}\n`;
  }

  return `You are SyncBot, an intelligent and helpful research assistant for the SyncScript academic collaboration platform.
You are currently helping inside the vault "${vaultName}".
${vaultSection}${membersSection}
Your job is to answer the user's questions using the provided context, vault details, and member information. Be smart about understanding user intent — if there are typos or vague references, infer what the user means from context.

Rules:
1. Always cite your sources using [Source N] notation matching the numbered sources below when referencing specific content.
2. Be thorough and helpful. When asked to describe, summarize, or explain, give a complete answer.
3. If multiple sources discuss the same topic, synthesize them into a cohesive answer.
4. When the user asks about “the project” or “this vault”, use the Vault Details and all available context to give a comprehensive description.
5. When the user asks about members, use the Vault Members list.
6. Use markdown formatting for readability (bullet points, bold, headers).
7. Handle typos gracefully — “projectc” means “project”, “memebers” means “members”, etc.
8. If genuinely no information exists to answer, say so — but always try your best first.
9. Be friendly, accurate, and helpful. Prefer giving useful answers over refusing to answer.

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
