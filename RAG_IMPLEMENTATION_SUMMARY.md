# RAG Chatbot Implementation Summary

## Overview

SyncBot is an AI-powered research assistant integrated into SyncScript vaults. It uses **Retrieval-Augmented Generation (RAG)** to answer questions grounded in the vault's sources, annotations, and files — with inline citations.

**Branch:** `feature/rag-design`  
**LLM Provider:** Google Gemini (free tier)  
**Embedding Model:** `gemini-embedding-001` (768 dimensions via `outputDimensionality`)  
**Chat Model:** `gemini-2.5-flash` (with automatic fallback to `gemini-flash-latest`, `gemini-flash-lite-latest`, `gemma-3-4b-it`)

---

## Architecture

```
User Question
     │
     ▼
┌─────────────────────┐
│  Chat API Route      │  POST /api/chat
│  (app/api/chat)      │
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Auth   │ │ RAG Pipeline │
│ Check  │ │              │
└────────┘ │ 1. Embed Q   │
           │ 2. Retrieve  │
           │ 3. Build     │
           │    Prompt    │
           │ 4. Stream    │
           │    Response  │
           └──────────────┘
                 │
                 ▼
         ┌──────────────┐
         │  Gemini API  │
         │  (Streaming)  │
         └──────────────┘
```

---

## Database Schema (Migrations)

### Migration 006: Enable pgvector
- `CREATE EXTENSION IF NOT EXISTS vector;`

### Migration 007: RAG Tables
- **`document_chunks`** — Stores text chunks with vector embeddings
  - `vault_id`, `source_type`, `source_id`, `chunk_index`, `content`, `embedding vector(768)`, `metadata`
  - HNSW index for fast cosine similarity search
- **`chat_conversations`** — Per-user conversation per vault
- **`chat_messages`** — Chat history with citations stored as JSONB
- **`match_vault_chunks`** — PostgreSQL RPC function for vector similarity search

### Migration 008: Fix Vector Dimensions
- Recreated embedding column and index as `vector(768)` to stay within pgvector's 2000-dim index limit

---

## Backend Components

### RAG Library (`lib/rag/`)

| File | Purpose |
|------|---------|
| `chunker.ts` | Splits text into ~1500-char overlapping chunks with paragraph/sentence boundary detection |
| `embeddings.ts` | Generates 768-dim embeddings via Gemini REST API (`gemini-embedding-001` with `outputDimensionality: 768`) |
| `retriever.ts` | Vector similarity search via `match_vault_chunks` RPC with JS cosine similarity fallback |
| `prompt.ts` | Builds system prompt with vault context and [Source N] citation rules |
| `auto-index.ts` | Server-side helpers to index/delete content chunks (used by API routes on CRUD operations) |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Main chat endpoint — SSE streaming with RAG context |
| `/api/chat/history` | GET | Load conversation history for a vault |
| `/api/chat/history` | DELETE | Clear conversation history |
| `/api/chat/index-vault` | POST | Bulk-index all existing vault content (sources, annotations, files) |
| `/api/embeddings` | POST | Manual indexing endpoint (upsert/delete individual items) |

### Chat Route Features
- **Model fallback chain:** `gemini-2.5-flash` → `gemini-flash-latest` → `gemini-flash-lite-latest` → `gemma-3-4b-it`
- **Retry logic:** 2 retries per model on 429 (rate limit) errors with exponential backoff
- **Direct REST API:** Uses `generativelanguage.googleapis.com` directly (not SDK) for full control over streaming and `system_instruction` format
- **SSE streaming:** Real-time token-by-token response delivery
- **Conversation persistence:** Messages saved to `chat_messages` table with citations

### Auto-Indexing (Wired into existing routes)
Content is automatically embedded when created or updated:
- `POST /api/vaults/[id]/sources` → indexes new source
- `PATCH /api/sources/[id]` → re-indexes updated source
- `DELETE /api/sources/[id]` → deletes source chunks
- `POST /api/annotations` → indexes new annotation
- `PATCH /api/annotations/[id]` → re-indexes updated annotation
- `DELETE /api/annotations/[id]` → deletes annotation chunks
- `POST /api/vaults/[id]/files` → indexes new file
- `DELETE /api/vaults/[id]/files` → deletes file chunks

---

## Frontend Components

### Chat UI (`components/`)

| Component | Purpose |
|-----------|---------|
| `vault-chat-panel.tsx` | Full chat interface — message list, input, SSE streaming, index vault button, clear history |
| `chat-message.tsx` | Message bubble with Markdown rendering (`react-markdown` + `remark-gfm`), citation badges, copy button |
| `citation-card.tsx` | Collapsible source references panel with type icons (link/annotation/file) |
| `suggested-questions.tsx` | Empty-state clickable question chips to help users get started |

### Chat Service (`lib/services/chat.service.ts`)
Client-side service with methods:
- `sendMessage()` — SSE streaming with callbacks for text/citations/done/error
- `getHistory()` — Load conversation history
- `clearHistory()` — Delete conversation
- `indexContent()` — Index individual content item
- `indexVault()` — Bulk-index all vault content

### Vault Page Integration (`app/vault/[id]/page.tsx`)
- Added "Chat" tab with `MessageSquare` icon
- `VaultChatPanel` rendered inside the Chat tab content

---

## Key Decisions & Trade-offs

| Decision | Reason |
|----------|--------|
| 768-dim embeddings (not native 3072) | pgvector HNSW index limit is 2000 dimensions on Supabase |
| Direct REST API (not Gemini SDK) | SDK had issues with `system_instruction` format and `outputDimensionality` param |
| Model fallback chain | Free tier quotas change frequently; auto-fallback ensures resilience |
| SSE streaming (not WebSocket) | Simpler, works with Next.js API routes, no extra infrastructure |
| Collapsible citations | 8+ citations were hiding the response; collapsed by default fixes UX |
| Bulk index endpoint | Existing content predates RAG; needs one-time backfill via "Index Vault" button |

---

## Dependencies Added

```
@google/generative-ai    — Gemini SDK (used for type reference)
react-markdown            — Markdown rendering in chat bubbles
remark-gfm               — GitHub Flavored Markdown support
```

---

## Environment Variables Required

```env
GEMINI_API_KEY=<your-gemini-api-key>
```

(Added to `frontend/.env.local` alongside existing Supabase variables)

---

## Bugs Fixed During Implementation

1. **Missing auth headers** — `chat.service.ts` wasn't sending `Authorization: Bearer` token (all other services did). Fixed by adding `getAuthHeaders()`.

2. **Embedding model 404** — `text-embedding-004` deprecated by Google. Switched to `gemini-embedding-001`.

3. **pgvector 2000-dim limit** — `gemini-embedding-001` natively outputs 3072 dims. Fixed by using REST API with `outputDimensionality: 768`.

4. **`system_instruction` format error** — Gemini API expects Content object `{parts: [{text}]}`, not a plain string. Fixed in chat route.

5. **`gemini-2.0-flash` quota removed** — Google removed free tier for this model. Switched to `gemini-2.5-flash` with multi-model fallback.

6. **Missing imports after merge** — `usePermissions`, `PermissionProvider`, `NotificationCenter`, `ConnectionStatus` lost during merge. Re-added.

7. **Citations hiding response** — Moved citations inside scrollable area and made them collapsible.

---

## How to Use

1. Navigate to any vault → **Chat** tab
2. Click **"Index Vault"** button (one-time, indexes all existing content)
3. Ask questions like:
   - "Summarize the content in this vault"
   - "What sources discuss transformer architecture?"
   - "What annotations were made about GPT-4?"
4. SyncBot responds with grounded answers and `[Source N]` citations
5. Click **📎 Sources referenced** to expand citation details

---

## Commits (chronological)

| Commit | Description |
|--------|-------------|
| `33143e2` | Initial RAG implementation (migrations, lib, API, UI, auto-indexing) |
| `5bc3a8c` | Fix missing imports after merge |
| `7bc080f` | Fix auth token headers in chat service |
| `2a84bff` | Update embedding model to gemini-embedding-001 |
| `fe34433` | Fix vector dimensions to 768 (pgvector limit) |
| `15ce9f4` | Fix systemInstruction as Content object |
| `71ef62b` | Switch to gemini-2.5-flash with model fallback |
| `e56bdf5` | Add bulk vault indexing (API + UI button) |
| `9265b4a` | Make citations collapsible and inside scroll area |
