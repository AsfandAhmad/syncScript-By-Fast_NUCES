# SyncScript — DevOps / Realtime & Performance Implementation

**Role:** DevOps / Realtime & Performance Engineer  
**Stack:** Next.js · Supabase · Express · Upstash Redis · Vercel

---

## 1. Real-Time Collaboration System

**File:** `frontend/hooks/use-vault-realtime.ts`

- Built a unified `useVaultRealtime(vaultId)` React hook using **Supabase Realtime** (postgres_changes).
- Subscribes to **INSERT**, **UPDATE**, and **DELETE** events on 4 tables:
  - `vaults`, `sources`, `annotations`, `vault_members`
- All filtered by `vault_id` for scoped updates.
- Returns `{ table, eventType, newRecord, oldRecord, receivedAt }`.
- Auto-cleans up subscriptions on component unmount or `vaultId` change.

---

## 2. In-App Notification System

**File:** `frontend/hooks/use-vault-notifications.ts`

- Wraps `useVaultRealtime` and triggers **sonner toast notifications** on every realtime event.
- Dynamic notification messages based on table + event type:
  | Event | Toast |
  |---|---|
  | Source added | ✅ "New source added" |
  | Annotation added | ✅ "New annotation" |
  | Contributor added | ✅ "Contributor added" |
  | Role updated | ℹ️ "Role updated" |
  | Source/member removed | ⚠️ Warning toast |
- Integrated into the vault detail page (`app/vault/[id]/page.tsx`).

---

## 3. Redis Caching Layer (Upstash)

**File:** `backend/services/cacheService.js`

- Uses **Upstash Redis** (REST-based, serverless).
- Cache key format:
  - `vault:{id}` — vault details
  - `vault:{id}:sources:p{page}:l{limit}` — paginated sources
- **TTL:** 60 seconds.
- Flow: Check cache → if HIT return cached → if MISS fetch from Supabase → store in Redis → return.
- Graceful degradation: if Redis env vars are missing, caching is skipped (no crash).

---

## 4. Rate Limiting (API Security)

**File:** `backend/middleware/rateLimiter.js`

- **100 requests per 15 minutes per IP** using `express-rate-limit`.
- Returns structured JSON on limit exceeded:
  ```json
  { "error": "Too many requests" }
  ```
- Applied globally to all backend routes.

**File:** `backend/middleware/requestLogger.js`

- Structured JSON request logging (method, URL, status, duration, IP, timestamp).
- Warn-level logging for 4xx/5xx responses.

---

## 5. Event-Driven Architecture

```
backend/
├── server.js                     # Express app entry point
├── controllers/
│   └── vaultController.js        # GET /vault/:id, GET /vault/:id/sources
├── services/
│   ├── cacheService.js           # Redis get/set/invalidate
│   ├── realtimeService.js        # Supabase → Redis cache invalidation
│   └── notificationService.js    # Server-side event logging
├── middleware/
│   ├── rateLimiter.js            # 100 req/15 min per IP
│   └── requestLogger.js          # Structured request logging
├── .env                          # Environment variables
└── .env.example                  # Template for team
```

Clean separation of concerns: controllers handle HTTP, services handle business logic, middleware handles cross-cutting concerns.

---

## 6. Real-Time Cache Invalidation

**File:** `backend/services/realtimeService.js`

- Backend subscribes to **Supabase Realtime** on startup.
- When a source/member/vault is inserted, updated, or deleted:
  - Relevant Redis cache keys are **automatically invalidated**.
  - Server-side notification is logged.
- No manual cache clearing needed — fully event-driven.

---

## 7. Performance Optimization

**File:** `supabase/migrations/003_performance_indexes.sql`

- **Composite indexes** added for all hot query paths:
  - `sources(vault_id, created_at DESC)` — source listing
  - `annotations(source_id, created_at DESC)` — annotation listing
  - `vault_members(vault_id, user_id)` — membership lookups
  - `activity_logs(vault_id, timestamp DESC)` — activity feed
  - `files(vault_id, created_at DESC)` — file listing
  - `vaults(owner_id, created_at DESC)` — dashboard
- **Pagination** implemented in `GET /vault/:id/sources`:
  - Query params: `?page=1&limit=20`
  - Max page size: 100
  - Returns `{ data, pagination: { page, limit, total, totalPages } }`
- **Supabase Realtime publication** enabled on all core tables.

---

## 8. Deployment Configuration

### Environment Variables Required

| Variable | Used By | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Both | Server-side Supabase admin access |
| `UPSTASH_REDIS_REST_URL` | Backend | Redis cache endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Backend | Redis auth token |
| `PORT` | Backend | Express server port (default: 4000) |

### Running Locally

```bash
# Frontend (port 3000)
cd frontend && npm install --legacy-peer-deps && npm run dev

# Backend (port 4000)
cd backend && npm install && npm run dev
```

### Deployment

- **Frontend:** Deploy to **Vercel** — push to GitHub, connect repo, add env vars.
- **Backend:** Deploy to **Railway** — connect repo, set root to `backend/`, add env vars.

---

## Architecture Diagram

```
┌─────────────┐     Realtime WS      ┌──────────────────┐
│   Browser    │◄────────────────────►│    Supabase       │
│  (Next.js)   │     REST API         │  (Postgres +      │
│              │────────────────────►│   Auth + Storage)  │
└──────┬───────┘                      └────────┬─────────┘
       │                                       │
       │  REST                    Realtime WS  │
       ▼                                       ▼
┌──────────────┐                      ┌────────────────┐
│   Express    │◄─────────────────────│  Cache          │
│   Backend    │   auto-invalidate    │  Invalidation   │
│  (port 4000) │                      │  Listener       │
└──────┬───────┘                      └────────────────┘
       │
       ▼
┌──────────────┐
│   Upstash    │
│   Redis      │
│  (60s TTL)   │
└──────────────┘
```

---

**Total files created:** 10  
**Total files modified:** 1 (`app/vault/[id]/page.tsx` — added notification hook)
