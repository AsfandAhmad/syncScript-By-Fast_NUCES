# SyncScript — Work Summary

## Project Overview

**SyncScript** is an academic collaboration platform built with **Next.js 16 (App Router)**, **Supabase** (PostgreSQL, Auth, Realtime, Storage), **TypeScript**, **Tailwind CSS**, and **Shadcn UI**. It allows research teams to organize work into vaults, manage sources/citations, annotate documents, upload files, and collaborate in real time.

---

## What Was Implemented

### Phase 1: Role-Based Access Control

| File | Type | Purpose |
|------|------|---------|
| `hooks/use-permissions.ts` | New | Derives boolean permission flags (canCreateSource, canDeleteFile, canManageMembers, etc.) from a user's vault role (owner / contributor / viewer) |
| `contexts/permission-context.tsx` | New | React context provider to share permissions without prop drilling |
| `components/vault-card.tsx` | Modified | Shows RoleBadge per vault; delete button only for owners |
| `components/file-list-panel.tsx` | Modified | `canDelete` prop hides delete buttons for viewers |
| `components/annotation-editor.tsx` | Modified | `canAdd`/`canEdit` props hide create form and edit/delete controls |
| `app/vault/[id]/page.tsx` | Modified | Fetches user role, wraps page in PermissionProvider, conditionally renders all action buttons |
| `app/dashboard/page.tsx` | Modified | Fetches roles for each vault, passes to VaultCard |

---

### Phase 2: Forms & Modals

| File | Type | Purpose |
|------|------|---------|
| `lib/form-validators.ts` | New | Zod schemas for all forms (URL, vault name, source title, annotation content, email) |
| `components/confirm-dialog.tsx` | New | Reusable AlertDialog for destructive actions with async loading state |
| `components/add-source-dialog.tsx` | New | Dialog with react-hook-form + zod for adding sources |
| `components/edit-source-dialog.tsx` | New | Dialog for editing sources with version display |
| `components/edit-vault-dialog.tsx` | New | Dialog for editing vault name/description |
| `components/vault-settings-dialog.tsx` | New | Vault settings with stats, archive toggle, and danger-zone delete |
| `components/create-vault-dialog.tsx` | New | Standalone vault creation dialog (extracted from inline) |

All inline dialogs were refactored into standalone components. Delete operations now require confirmation.

---

### Phase 3: Enhanced Real-Time

| File | Type | Purpose |
|------|------|---------|
| `lib/services/realtime.service.ts` | Modified | Added `subscribeToFiles()` and `subscribeToNotifications()` methods |
| `hooks/use-realtime.ts` | Modified | Added `useRealtimeFiles()` and `useRealtimeNotifications()` hooks |
| `hooks/use-connection-status.ts` | New | Monitors Supabase WebSocket + browser online/offline status |
| `components/connection-status.tsx` | New | Yellow warning banner displayed when real-time connection is lost |

---

### Phase 4: File Upload Integration

| File | Type | Purpose |
|------|------|---------|
| `components/file-uploader.tsx` | Modified | File validation (50 MB max, allowed types), simulated upload progress bar |
| `components/file-preview-dialog.tsx` | New | Inline preview for images/PDFs via signed URLs; download button for all types |
| `components/file-list-panel.tsx` | Modified | File-type icons (PDF red, image blue, spreadsheet green), click-to-preview, `stopPropagation` on action buttons |

---

### Phase 5: Notification System

| File | Type | Purpose |
|------|------|---------|
| `supabase/migrations/004_notifications.sql` | New | Notifications table with RLS policies and realtime publication |
| `lib/database.types.ts` | Modified | Added `Notification` and `NotificationType` types |
| `lib/services/notification.service.ts` | New | Full CRUD service: create, getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, notifyVaultMembers (batch) |
| `components/notification-item.tsx` | New | Notification row with type-specific icons, unread indicator, relative timestamps |
| `components/notification-center.tsx` | New | Bell icon popover with unread count badge, mark-all-read, click-to-navigate, real-time updates |
| `app/api/vaults/[id]/members/route.ts` | Modified | Notifies added member when they're invited to a vault |
| `app/api/vaults/[id]/sources/route.ts` | Modified | Notifies all vault members (except creator) when a source is added |
| `app/api/vaults/[id]/files/route.ts` | Modified | Notifies all vault members (except uploader) when a file is uploaded |
| `app/api/annotations/route.ts` | Modified | Notifies all vault members (except annotator) when an annotation is created |
| `app/dashboard/page.tsx` | Modified | NotificationCenter added to header |
| `app/vault/[id]/page.tsx` | Modified | NotificationCenter added to header |

---

### Phase 6: Polish & Responsive Design

| File | Type | Purpose |
|------|------|---------|
| `components/empty-state.tsx` | New | Reusable empty state with icon, title, description, and optional action button |
| `components/error-boundary.tsx` | New | React error boundary with user-friendly message and retry button |
| `components/skeletons.tsx` | New | Skeleton loaders for source lists, file lists, annotations, and member lists |
| `hooks/use-debounce.ts` | New | Generic debounce hook (300 ms default) for search inputs |
| `app/layout.tsx` | Modified | Wrapped children in ErrorBoundary; added SEO meta tags (OpenGraph, Twitter Card) |
| `app/dashboard/page.tsx` | Modified | Debounced search; aria-labels on icon buttons |
| `app/vault/[id]/page.tsx` | Modified | Responsive tabs (scrollable, icon-only labels on mobile); aria-labels |
| `app/login/page.tsx` | Modified | Wrapped in Suspense boundary to fix build error |

---

### Phase 7: Integration Testing

| File | Type | Purpose |
|------|------|---------|
| `INTEGRATION_TEST_CHECKLIST.md` | New | Comprehensive test checklist covering 3 user journeys, real-time sync, notifications, RBAC, file management, forms, edge cases, and responsive design |

---

### Phase 8: Deployment Prep

| File | Type | Purpose |
|------|------|---------|
| `frontend/.env.example` | New | Documented environment variables template |
| `next.config.mjs` | Modified | Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) |
| `app/layout.tsx` | Modified | Full SEO metadata: keywords, OpenGraph, Twitter Card, robots |

**Production build verified** — compiles with zero errors.

---

## Architecture Summary

```
frontend/
├── app/                        # Next.js App Router pages & API routes
│   ├── api/                    # Server-side API (auth, vaults, sources, files, annotations, seed)
│   ├── dashboard/              # Main vault listing with search, create, delete
│   ├── vault/[id]/             # Vault detail with tabs: Sources, Files, Members, Activity
│   ├── login/ signup/          # Auth pages
│   └── settings/               # User profile settings
├── components/                 # UI components
│   ├── ui/                     # Shadcn primitives (button, card, dialog, etc.)
│   ├── notification-center.tsx # Bell icon with unread badge + popover
│   ├── file-preview-dialog.tsx # Inline image/PDF preview
│   ├── confirm-dialog.tsx      # Reusable confirmation dialog
│   ├── error-boundary.tsx      # Global error catcher
│   └── ...                     # 25+ components total
├── hooks/                      # Custom React hooks
│   ├── use-permissions.ts      # RBAC permission derivation
│   ├── use-realtime.ts         # 5 real-time subscription hooks
│   ├── use-connection-status.ts
│   └── use-debounce.ts
├── lib/
│   ├── database.types.ts       # All TypeScript interfaces (single source of truth)
│   ├── form-validators.ts      # Zod validation schemas
│   └── services/               # API service layer
│       ├── vault.service.ts
│       ├── source.service.ts
│       ├── file.service.ts
│       ├── notification.service.ts
│       └── realtime.service.ts
└── contexts/
    └── permission-context.tsx   # RBAC context provider
```

---

## Tech Stack

- **Framework:** Next.js 16.1.6 (Turbopack, App Router)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Forms:** React Hook Form + Zod + @hookform/resolvers
- **Toasts:** Sonner
- **Icons:** Lucide React

## Database Tables

| Table | Purpose |
|-------|---------|
| `vaults` | Research vaults (name, description, owner, archived) |
| `vault_members` | Membership with roles: owner, contributor, viewer |
| `sources` | URLs/references with versioning |
| `annotations` | Comments on sources with versioning |
| `files` | File metadata (stored in Supabase Storage) |
| `activity_logs` | Audit trail of all actions |
| `notifications` | In-app notification system |

## Running the Project

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev        # http://localhost:3000
npm run build      # Production build
```

**Environment:** Requires `.env.local` with Supabase credentials (see `.env.example`).

## Git

- **Branch:** `work`
- **Remote:** https://github.com/AsfandAhmad/syncScript-By-Fast_NUCES
