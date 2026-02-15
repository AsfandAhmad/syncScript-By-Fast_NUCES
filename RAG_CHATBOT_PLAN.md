# RAG Chatbot for SyncScript Vaults — Implementation Plan

## 1. Overview

A **Retrieval-Augmented Generation (RAG)** chatbot that lives inside each vault, allowing members to ask natural-language questions about the vault's content — sources, annotations, and uploaded files. The system retrieves the most relevant chunks of vault data, passes them as context to an LLM, and returns a grounded answer with citations.

### Core User Experience

```
┌─────────────────────────────────────────────────────────────────┐
│  Team Collaboration Space                              [Owner] │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│ Sources  │ Files    │ Members  │ Activity │ 💬 Chat  │         │
├──────────┴──────────┴──────────┴──────────┴──────────┴─────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🤖 SyncBot: Hi! Ask me anything about this vault.       │  │
│  │                                                          │  │
│  │ 👤 You: What are the main findings from the AI survey?   │  │
│  │                                                          │  │
│  │ 🤖 SyncBot: Based on the sources in this vault, the      │  │
│  │    main findings from the AI survey are:                  │  │
│  │    1. 78% of respondents use LLMs daily [Source: ...]     │  │
│  │    2. Data quality remains the top concern [Annotation..] │  │
│  │                                                          │  │
│  │ 👤 You: Summarize all annotations by Ahmed               │  │
│  │                                                          │  │
│  │ 🤖 SyncBot: Ahmed made 3 annotations across 2 sources... │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Type your question...]                        [Send ▶] │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### What Users Can Ask

| Category | Example Questions |
|----------|------------------|
| **Content lookup** | "What does source X say about machine learning?" |
| **Annotation search** | "Show me all annotations about data privacy" |
| **File queries** | "What files were uploaded related to the proposal?" |
| **Summarisation** | "Summarize all sources added this week" |
| **Cross-reference** | "Which sources and annotations mention 'neural networks'?" |
| **Member context** | "What did Ahmed annotate on the AI paper?" |

---

## 2. Architecture

```
                    ┌─────────────────────────────┐
                    │       Frontend (Next.js)     │
                    │  ┌───────────────────────┐   │
                    │  │  VaultChatPanel.tsx    │   │
                    │  │  (chat UI component)  │   │
                    │  └─────────┬─────────────┘   │
                    │            │ POST /api/chat   │
                    │            ▼                  │
                    │  ┌───────────────────────┐   │
                    │  │  /api/chat/route.ts    │   │
                    │  │  (Next.js API Route)   │   │
                    │  └─────────┬─────────────┘   │
                    └────────────┼──────────────────┘
                                 │
          ┌──────────────────────┼───────────────────────┐
          │                      │                        │
          ▼                      ▼                        ▼
  ┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐
  │   Supabase   │    │  Embedding Model  │    │    LLM (OpenAI   │
  │  PostgreSQL  │    │  (OpenAI or local) │    │   / Gemini /     │
  │              │    │                   │    │   Groq / local)  │
  │ ┌──────────┐ │    │  text → vector    │    │                  │
  │ │ pgvector │ │    └───────────────────┘    │  context → answer│
  │ │embeddings│ │                              └──────────────────┘
  │ └──────────┘ │
  │ ┌──────────┐ │
  │ │ sources  │ │
  │ │ annot.   │ │
  │ │ files    │ │
  │ └──────────┘ │
  └──────────────┘
```

### Data Flow (Per User Query)

1. **User** types a question in the Chat tab.
2. **Frontend** sends `POST /api/chat` with `{ vaultId, question, conversationHistory }`.
3. **API Route** authenticates the user, verifies vault membership.
4. **Embedding**: The question is converted to a vector using the embedding model.
5. **Retrieval**: `pgvector` similarity search finds the top-K most relevant chunks from the vault's indexed content.
6. **Augmentation**: The retrieved chunks are formatted into a context prompt.
7. **Generation**: The LLM receives `system prompt + context chunks + conversation history + question` and generates an answer.
8. **Response**: The answer (with citation references) streams back to the frontend.

---

## 3. Database Schema — New Tables & Extensions

### 3.1 Enable pgvector

```sql
-- Migration: 006_enable_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;
```

> **Note**: Supabase supports `pgvector` out-of-the-box. No extra installation needed.

### 3.2 Document Chunks Table

Stores chunked + embedded content from sources, annotations, and files.

```sql
-- Migration: 007_rag_schema.sql

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,

  -- Origin tracking
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('source', 'annotation', 'file')),
  source_id UUID NOT NULL,              -- references sources.id, annotations.id, or files.id
  chunk_index INTEGER NOT NULL DEFAULT 0,

  -- Content
  content TEXT NOT NULL,                 -- the actual text chunk
  metadata JSONB DEFAULT '{}',           -- title, author, url, page number, etc.

  -- Embedding vector (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(source_type, source_id, chunk_index)
);

-- Indexes
CREATE INDEX idx_chunks_vault_id ON document_chunks(vault_id);
CREATE INDEX idx_chunks_source ON document_chunks(source_type, source_id);

-- HNSW index for fast similarity search (cosine distance)
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 3.3 Chat History Table

Persists conversation threads per user per vault.

```sql
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),                    -- auto-generated from first message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vault_id, user_id)              -- one conversation per user per vault (can be changed)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',          -- array of { source_type, source_id, title, snippet }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_conv_vault_user ON chat_conversations(vault_id, user_id);
CREATE INDEX idx_chat_messages_conv ON chat_messages(conversation_id, created_at);
```

---

## 4. Embedding Pipeline — Indexing Vault Content

### 4.1 What Gets Indexed

| Content Type | What is Chunked | Metadata Stored |
|---|---|---|
| **Sources** | URL title + metadata fields (description, abstract, etc.) | `{ source_id, title, url, created_by }` |
| **Annotations** | Full annotation text | `{ annotation_id, source_id, author_name, author_email }` |
| **Files** (text-based) | Extracted text, split into ~500-token chunks | `{ file_id, file_name, page_number, uploaded_by }` |

### 4.2 Chunking Strategy

- **Chunk size**: ~500 tokens (~2000 chars) with 100-token overlap.
- **Splitting**: By paragraph boundaries first, then sentence boundaries, then hard token limit.
- **Metadata preservation**: Each chunk carries its origin `source_type`, `source_id`, title, author, and position (`chunk_index`).

### 4.3 When Indexing Happens

| Trigger | Action |
|---|---|
| Source created/updated | Re-chunk and re-embed the source metadata + title |
| Annotation created/updated | Embed the annotation content (usually 1 chunk) |
| Annotation deleted | Delete corresponding chunks |
| Source deleted | Delete all chunks for that source + its annotations |
| File uploaded (text/md/txt/pdf) | Extract text → chunk → embed |
| File deleted | Delete corresponding chunks |

### 4.4 Embedding API

File: `frontend/app/api/embeddings/route.ts`

```
POST /api/embeddings/index
Body: { vault_id, source_type, source_id }
→ Fetches content, chunks it, embeds via OpenAI, upserts into document_chunks
```

This endpoint is called **automatically** by the existing source/annotation/file API routes after successful create/update/delete operations (fire-and-forget).

### 4.5 Embedding Model Options

| Model | Dimensions | Cost | Notes |
|---|---|---|---|
| **OpenAI `text-embedding-3-small`** | 1536 | $0.02/1M tokens | Recommended — best balance of cost + quality |
| OpenAI `text-embedding-3-large` | 3072 | $0.13/1M tokens | Higher quality, higher cost |
| Gemini `text-embedding-004` | 768 | Free tier available | Good free option |
| Local (e.g. `all-MiniLM-L6-v2`) | 384 | Free | Requires running a model server |

**Default choice**: `text-embedding-3-small` (1536 dims). The schema uses `vector(1536)` accordingly.

---

## 5. Retrieval — Similarity Search

### 5.1 Vector Search Function (Postgres RPC)

```sql
-- Function: match_vault_chunks
CREATE OR REPLACE FUNCTION match_vault_chunks(
  p_vault_id UUID,
  p_query_embedding vector(1536),
  p_match_count INTEGER DEFAULT 8,
  p_match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  source_type VARCHAR,
  source_id UUID,
  chunk_index INTEGER,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.source_type,
    dc.source_id,
    dc.chunk_index,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> p_query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.vault_id = p_vault_id
    AND 1 - (dc.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
```

### 5.2 Retrieval Strategy

1. **Embed the user's question** → get query vector.
2. **Call `match_vault_chunks(vault_id, query_vector, top_k=8, threshold=0.7)`**.
3. **De-duplicate** by `source_id` if multiple chunks from the same source appear.
4. **Re-rank** (optional): Use a cross-encoder or simple keyword overlap score to re-rank the top-K results.
5. **Format** each chunk as a numbered citation block for the prompt.

---

## 6. Generation — LLM Integration

### 6.1 LLM Provider Options

| Provider | Model | Streaming | Cost |
|--|--|--|--|
| **OpenAI** | `gpt-4o-mini` | ✅ Yes | $0.15/$0.60 per 1M in/out |
| OpenAI | `gpt-4o` | ✅ Yes | $2.50/$10 per 1M in/out |
| **Groq** | `llama-3.1-70b-versatile` | ✅ Yes | Free tier / very cheap |
| Google | `gemini-2.0-flash` | ✅ Yes | Free tier available |
| Local | Ollama (llama3, mistral) | ✅ Yes | Free, self-hosted |

**Default choice**: `gpt-4o-mini` (great quality, very affordable, supports streaming).

### 6.2 System Prompt

```
You are SyncBot, an intelligent research assistant for the SyncScript collaboration platform.
You are currently inside vault "{vault_name}".

Your job is to answer the user's questions using ONLY the provided context from the vault's sources, annotations, and files. If the context does not contain enough information to answer, say so clearly — do NOT make up information.

Rules:
1. Always cite your sources using [Source N] notation.
2. Keep answers concise but thorough.
3. If multiple sources discuss the same topic, synthesize them.
4. When the user asks about a specific member's contributions, filter by author.
5. Use markdown formatting for readability (bullet points, bold, headers).
6. If the question is unrelated to the vault content, politely redirect.

Context from vault (retrieved via similarity search):
---
{formatted_chunks}
---
```

### 6.3 Context Window Management

- **Max context tokens**: ~6000 tokens for retrieved chunks (leaves room for system prompt + conversation history + response).
- **Conversation history**: Include last 6 messages (3 user + 3 assistant) for continuity.
- **Token budget**:
  - System prompt: ~300 tokens
  - Retrieved chunks: ~6000 tokens
  - Conversation history: ~2000 tokens
  - User question: ~200 tokens
  - Response budget: ~2000 tokens
  - **Total**: ~10,500 tokens (well within gpt-4o-mini's 128K context)

---

## 7. API Routes

### 7.1 Chat Endpoint

**File**: `frontend/app/api/chat/route.ts`

```
POST /api/chat
Headers: Authorization (via cookie/session)
Body: {
  vaultId: string,
  question: string,
  conversationId?: string   // optional, to continue existing conversation
}
Response: ReadableStream (SSE) with chunks of the LLM response
Final chunk includes: { citations: [...], conversationId: string }
```

**Flow**:
1. Authenticate user → verify vault membership.
2. Load or create `chat_conversations` record.
3. Save user message to `chat_messages`.
4. Embed the question.
5. Retrieve top-K chunks from `document_chunks`.
6. Build prompt (system + context + history + question).
7. Stream LLM response to client.
8. On completion, save assistant message + citations to `chat_messages`.

### 7.2 Embedding Index Endpoint

**File**: `frontend/app/api/embeddings/route.ts`

```
POST /api/embeddings
Body: {
  vaultId: string,
  sourceType: 'source' | 'annotation' | 'file',
  sourceId: string,
  action: 'upsert' | 'delete'
}
Response: { success: boolean, chunksProcessed: number }
```

### 7.3 Chat History Endpoint

**File**: `frontend/app/api/chat/history/route.ts`

```
GET /api/chat/history?vaultId=xxx
Response: { data: ChatMessage[] }

DELETE /api/chat/history?conversationId=xxx
Response: { success: true }
```

---

## 8. Frontend Components

### 8.1 VaultChatPanel (`components/vault-chat-panel.tsx`)

The main chat UI component, rendered as a new tab ("Chat") in the vault detail page.

**Features**:
- Message bubbles (user = right-aligned, assistant = left-aligned)
- Streaming response display (typewriter effect)
- Citation chips at the bottom of assistant messages (clickable → navigates to source/annotation)
- Auto-scroll to bottom on new messages
- Loading indicator while LLM is generating
- Empty state with suggested questions
- "Clear history" button

**Props**:
```typescript
interface VaultChatPanelProps {
  vaultId: string;
  vaultName: string;
  sources: Source[];      // for citation linking
}
```

### 8.2 ChatMessage Component (`components/chat-message.tsx`)

Renders a single message bubble.

**Features**:
- Markdown rendering for assistant messages (using `react-markdown`)
- Citation badges `[Source 1]`, `[Source 2]` rendered as clickable chips
- Timestamp display
- Copy-to-clipboard button on assistant messages
- Avatar: user avatar or SyncBot icon

### 8.3 CitationCard Component (`components/citation-card.tsx`)

A small inline card shown below assistant responses listing the sources used.

```
┌──────────────────────────────────────────────────────┐
│  📎 Sources used:                                    │
│  [1] AI Survey 2025 (source)  [2] Ahmed's note (ann) │
└──────────────────────────────────────────────────────┘
```

### 8.4 Suggested Questions (`components/suggested-questions.tsx`)

Shown in the empty state, auto-generated based on vault content:
- "Summarize all sources in this vault"
- "What are the key topics discussed?"
- "List all annotations by [member name]"

---

## 9. Integration with Existing Code

### 9.1 Vault Detail Page — Add Chat Tab

**File**: `frontend/app/vault/[id]/page.tsx`

Add a 5th tab "Chat" alongside Sources, Files, Members, Activity:

```tsx
<TabsTrigger value="chat">
  <MessageSquare className="h-4 w-4 mr-1.5" />
  Chat
</TabsTrigger>

<TabsContent value="chat">
  <VaultChatPanel vaultId={vaultId} vaultName={vault.name} sources={sources} />
</TabsContent>
```

### 9.2 Auto-Index on Content Changes

Modify existing API routes to trigger embedding after mutations:

| Route | After Action | Trigger |
|---|---|---|
| `POST /api/vaults/[id]/sources` | Source created | `POST /api/embeddings { action: 'upsert', sourceType: 'source', sourceId }` |
| `PUT /api/sources/[id]` | Source updated | Same as above |
| `DELETE /api/sources/[id]` | Source deleted | `POST /api/embeddings { action: 'delete', sourceType: 'source', sourceId }` |
| `POST /api/annotations` | Annotation created | `POST /api/embeddings { action: 'upsert', sourceType: 'annotation', sourceId }` |
| `PUT /api/annotations/[id]` | Annotation updated | Same as above |
| `DELETE /api/annotations/[id]` | Annotation deleted | `POST /api/embeddings { action: 'delete', sourceType: 'annotation', sourceId }` |
| `POST /api/vaults/[id]/files` | File uploaded | `POST /api/embeddings { action: 'upsert', sourceType: 'file', sourceId }` |
| `DELETE /api/files/[id]` | File deleted | `POST /api/embeddings { action: 'delete', sourceType: 'file', sourceId }` |

### 9.3 Service Layer

**File**: `frontend/lib/services/chat.service.ts`

```typescript
class ChatService {
  async sendMessage(vaultId: string, question: string, conversationId?: string): AsyncGenerator<string>
  async getHistory(vaultId: string): Promise<ChatMessage[]>
  async clearHistory(conversationId: string): Promise<void>
}
```

---

## 10. Environment Variables

Add to `frontend/.env.local`:

```env
# RAG / AI Configuration
OPENAI_API_KEY=sk-...your-openai-key

# Embedding model (default: text-embedding-3-small)
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# LLM model (default: gpt-4o-mini)
LLM_MODEL=gpt-4o-mini
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.3

# RAG Configuration
RAG_CHUNK_SIZE=500          # tokens per chunk
RAG_CHUNK_OVERLAP=100       # overlap tokens
RAG_TOP_K=8                 # number of chunks to retrieve
RAG_SIMILARITY_THRESHOLD=0.7
```

---

## 11. New Dependencies

```bash
# Frontend
npm install openai react-markdown remark-gfm

# openai        — Official OpenAI SDK for embeddings + chat completions
# react-markdown — Render markdown in assistant responses
# remark-gfm    — GitHub-flavored markdown support (tables, task lists)
```

---

## 12. File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/006_enable_pgvector.sql` | **CREATE** | Enable pgvector extension |
| `supabase/migrations/007_rag_schema.sql` | **CREATE** | document_chunks, chat_conversations, chat_messages tables + RPC function |
| `frontend/app/api/chat/route.ts` | **CREATE** | Main chat endpoint with streaming |
| `frontend/app/api/chat/history/route.ts` | **CREATE** | Chat history CRUD |
| `frontend/app/api/embeddings/route.ts` | **CREATE** | Embedding index/delete endpoint |
| `frontend/lib/services/chat.service.ts` | **CREATE** | Client-side chat service |
| `frontend/lib/rag/chunker.ts` | **CREATE** | Text chunking utility |
| `frontend/lib/rag/embeddings.ts` | **CREATE** | Embedding generation wrapper |
| `frontend/lib/rag/retriever.ts` | **CREATE** | Vector search + context formatting |
| `frontend/lib/rag/prompt.ts` | **CREATE** | System prompt builder |
| `frontend/components/vault-chat-panel.tsx` | **CREATE** | Main chat UI panel |
| `frontend/components/chat-message.tsx` | **CREATE** | Single message bubble |
| `frontend/components/citation-card.tsx` | **CREATE** | Source citation display |
| `frontend/components/suggested-questions.tsx` | **CREATE** | Empty-state suggestions |
| `frontend/app/vault/[id]/page.tsx` | **EDIT** | Add Chat tab |
| `frontend/app/api/vaults/[id]/sources/route.ts` | **EDIT** | Trigger embedding on create/delete |
| `frontend/app/api/annotations/route.ts` | **EDIT** | Trigger embedding on create/delete |
| `frontend/app/api/vaults/[id]/files/route.ts` | **EDIT** | Trigger embedding on upload/delete |
| `frontend/lib/database.types.ts` | **EDIT** | Add ChatConversation, ChatMessage, DocumentChunk types |
| `frontend/.env.local` | **EDIT** | Add OpenAI key + RAG config |
| `frontend/.env.example` | **EDIT** | Document new env vars |

---

## 13. Implementation Phases

### Phase 1 — Database & Types (Foundation)
1. Create migration `006_enable_pgvector.sql`
2. Create migration `007_rag_schema.sql` (tables + RPC function)
3. Add TypeScript types (`DocumentChunk`, `ChatConversation`, `ChatMessage`)
4. Run migrations in Supabase SQL Editor

### Phase 2 — Embedding Pipeline (Backend)
5. Create `lib/rag/chunker.ts` — text chunking utility
6. Create `lib/rag/embeddings.ts` — OpenAI embedding wrapper
7. Create `app/api/embeddings/route.ts` — index/delete endpoint
8. Install `openai` package

### Phase 3 — Retrieval (Backend)
9. Create `lib/rag/retriever.ts` — vector search via Supabase RPC
10. Create `lib/rag/prompt.ts` — system prompt + context formatter

### Phase 4 — Chat API (Backend)
11. Create `app/api/chat/route.ts` — streaming chat endpoint
12. Create `app/api/chat/history/route.ts` — history management
13. Create `lib/services/chat.service.ts` — client service layer

### Phase 5 — Chat UI (Frontend)
14. Create `components/chat-message.tsx` — message bubble
15. Create `components/citation-card.tsx` — citation display
16. Create `components/suggested-questions.tsx` — empty state
17. Create `components/vault-chat-panel.tsx` — main chat panel
18. Install `react-markdown` + `remark-gfm`

### Phase 6 — Integration
19. Add Chat tab to vault detail page (`vault/[id]/page.tsx`)
20. Wire up auto-indexing in source/annotation/file API routes
21. Update `.env.example` with new variables

### Phase 7 — Testing & Polish
22. Test embedding pipeline with existing vault data
23. Test chat with various question types
24. Add error handling, loading states, edge cases
25. Add rate limiting for chat endpoint (prevent abuse)

---

## 14. Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Vault access control** | Chat API verifies user is a vault member before querying |
| **OpenAI key exposure** | Key is server-side only (`OPENAI_API_KEY`, no `NEXT_PUBLIC_` prefix) |
| **Prompt injection** | System prompt includes strict grounding rules; user input is in a separate message |
| **Rate limiting** | Max 20 chat messages per minute per user (via existing rate limiter) |
| **Data isolation** | All queries filter by `vault_id` — users can never access other vaults' data |
| **Content in context** | Only chunks from the user's vault appear in the LLM prompt |

---

## 15. Cost Estimation

For a vault with ~50 sources + 200 annotations + 20 files:

| Operation | Volume | Cost |
|-----------|--------|------|
| Initial embedding (one-time) | ~100K tokens | ~$0.002 |
| Per chat query (embedding) | ~100 tokens | ~$0.000002 |
| Per chat query (LLM) | ~8K in + 1K out | ~$0.0018 |
| **Monthly (100 queries/day)** | | **~$5.40/month** |

Very affordable — even with heavy use, a vault's RAG costs stay under $10/month.

---

## 16. Future Enhancements (Out of Scope for V1)

- **File content extraction**: Parse PDF/DOCX content for deeper indexing (requires `pdf-parse` or similar)
- **Web scraping**: Fetch and index actual content from source URLs
- **Multi-vault search**: Search across all vaults the user has access to
- **Conversation branching**: Multiple conversation threads per vault
- **Voice input**: Whisper API integration for voice questions
- **Export**: Export chat as PDF/markdown
- **Fine-tuning**: Train a custom model on vault-specific terminology
