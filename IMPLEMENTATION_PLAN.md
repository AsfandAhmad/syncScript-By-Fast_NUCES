# SyncScript — Detailed Implementation Plan

> **Branch:** `work-asad`  
> **Date:** February 14, 2026  
> **Scope:** Vault dashboard, sources & annotations, role-based UI, modals/forms, real-time updates, file uploads, notifications

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Phase 0 — Critical Bug Fixes & Type Unification](#phase-0--critical-bug-fixes--type-unification)
3. [Phase 1 — Vault Dashboard & CRUD](#phase-1--vault-dashboard--crud)
4. [Phase 2 — Sources & Annotations List](#phase-2--sources--annotations-list)
5. [Phase 3 — Dynamic Role-Based UI](#phase-3--dynamic-role-based-ui)
6. [Phase 4 — Modals & Forms](#phase-4--modals--forms)
7. [Phase 5 — Real-Time Updates Integration](#phase-5--real-time-updates-integration)
8. [Phase 6 — File Upload Interface](#phase-6--file-upload-interface)
9. [Phase 7 — Notification UI](#phase-7--notification-ui)
10. [Phase 8 — Responsive Design & Polish](#phase-8--responsive-design--polish)
11. [Deliverables Checklist](#deliverables-checklist)

---

## 1. Current State Assessment

### What Exists (Backend / Services — Working)

| Layer | File | Status |
|-------|------|--------|
| DB Schema | `001_init_schema.sql` | ✅ 6 tables: `vaults`, `vault_members`, `sources`, `annotations`, `files`, `activity_logs` |
| RLS Policies | `002_enable_rls.sql` | ✅ Full role-based policies (owner/contributor/viewer) |
| Vault Service | `lib/services/vault.service.ts` | ✅ `getAllVaults`, `getVaultById`, `createVault`, `updateVault`, `deleteVault`, `getVaultMembers`, `addVaultMember`, `updateMemberRole`, `removeVaultMember` |
| Source Service | `lib/services/source.service.ts` | ✅ CRUD + activity logging + version locking |
| Annotation Service | `lib/services/source.annotation.service.ts` | ✅ CRUD + activity logging + version locking |
| File Service | `lib/services/file.service.ts` | ⚠️ Works except `calculateChecksum` (Node.js `crypto` — dead code, browser uses `crypto.subtle`) |
| Realtime Service | `lib/services/realtime.service.ts` | ✅ `subscribeToVault`, `subscribeToSources`, `subscribeToAnnotations`, `subscribeToMembers`, `subscribeToActivityLogs` |
| Realtime Hooks | `hooks/use-realtime.ts` | ✅ `useRealtimeSources`, `useRealtimeMembers`, `useRealtimeActivityLog`, `useRealtimeAnnotations` — **but NOT USED anywhere** |
| Auth Hook | `hooks/use-auth.ts` | ✅ `useAuth()` works; `useUserProfile()` references non-existent `profiles` table |
| Supabase Client | `lib/supabase-client.ts` | ✅ Browser client configured |
| Edge Functions | `auto-citation`, `activity-logger` | ✅ Deployed (DOI-based citation extraction, activity insertion) |

### What Exists (Frontend Pages — Broken / Partial)

| Page | File | Status | Issues |
|------|------|--------|--------|
| Landing | `app/page.tsx` | ✅ Works | Static, no issues |
| Login | `app/login/page.tsx` | ✅ Fixed | Was duplicated, stale code removed |
| Signup | `app/signup/page.tsx` | ✅ Works | — |
| Forgot Password | `app/forgot-password/page.tsx` | ✅ Works | — |
| Dashboard | `app/dashboard/page.tsx` | ❌ Broken | Missing `});` on useEffect, `createVault` called with wrong signature (object vs positional args), service response not unwrapped (`ApiResponse<T>`) |
| Vault Detail | `app/vault/[id]/page.tsx` | ❌ Broken | Same useEffect bug, `createSource` called with wrong signature, `source.createdAt` vs `created_at`, `source.author` doesn't exist on DB type |
| Settings | `app/settings/page.tsx` | ⚠️ Placeholder | `handleUpdateProfile` is a no-op |
| Source Detail | **MISSING** | ❌ Does not exist | Vault page links to `/vault/[id]/source/[sourceId]` — no page |
| Auth Callback | `app/auth/callback/route.ts` | ⚠️ Minimal | Doesn't exchange code for session |

### What Exists (Components — Type Mismatches)

| Component | File | Status | Issue |
|-----------|------|--------|-------|
| `VaultCard` | `components/vault-card.tsx` | ⚠️ | Uses `vault.createdAt` but DB type has `created_at` |
| `FileUploader` | `components/file-uploader.tsx` | ⚠️ | Wrong import path `@/lib/file.service` should be `@/lib/services/file.service` |
| `ActivityFeed` | `components/activity-feed.tsx` | ❌ | Uses mock `ActivityItem` type, not DB `ActivityLog` type |
| `AnnotationItem` | `components/annotation-item.tsx` | ❌ | Uses mock `Annotation` type (with `author`, `page`, `highlight`), not DB `Annotation` |
| `SourceItem` | `components/source-item.tsx` | ❌ | Uses mock `Source` type (with `authors`, `journal`, `doi`), not DB `Source` |
| `FileListPanel` | `components/file-list-panel.tsx` | ❌ | Uses mock `VaultFile` type, not DB `File` |
| `RoleBadge` | `components/role-badge.tsx` | ⚠️ | Uses `editor | reviewer` roles but DB has `contributor` |
| `PdfPreview` | `components/pdf-preview.tsx` | ❌ | Entirely hardcoded — no real PDF rendering |
| `VaultCardSkeleton` | `components/vault-card-skeleton.tsx` | ✅ | Works but unused |
| `ThemeProvider` | `components/theme-provider.tsx` | ✅ | Works but not used in layout |

### Critical Type System Conflict

Two completely incompatible type systems exist:

- **`lib/database.types.ts`** — snake_case, matches Supabase schema (`created_at`, `vault_id`, `owner_id`)
- **`lib/types.ts`** — camelCase, designed for mock data (`createdAt`, `fileCount`, `annotationCount`)

Components import from one or the other inconsistently. **All components and pages must be unified to use `database.types.ts`.**

---

## Phase 0 — Critical Bug Fixes & Type Unification

> **Goal:** Make the app compile and run without errors. Establish a single source-of-truth type system.
> **Estimated effort:** 3–4 hours

### Task 0.1 — Fix Dashboard Page (`app/dashboard/page.tsx`)

**Problem:** The `useEffect` on line ~36 is never closed. `handleCreateVault` is defined inside the `useEffect` block.

**Fix Steps:**
1. Add the missing `});` to close the `useEffect` after `loadVaults()` call (around line 51)
2. Move `handleCreateVault`, `handleDeleteVault`, `handleSignOut` OUT of the `useEffect` — they must be standalone functions in the component body
3. Fix `vaultService.createVault(...)` call — service expects `(name: string, description?: string)` positional args, not an object. Change from:
   ```ts
   vaultService.createVault({ name: newVaultName, description: '', isPublic: false })
   ```
   to:
   ```ts
   vaultService.createVault(newVaultName, '')
   ```
4. Unwrap `ApiResponse` — `vaultService.getAllVaults()` returns `ApiResponse<Vault[]>`, not `Vault[]`. Extract:
   ```ts
   const response = await vaultService.getAllVaults();
   if (response.status === 'error') throw new Error(response.error);
   setVaults(response.data || []);
   ```
5. Same for `createVault` and `deleteVault` — check `response.status` before using `response.data`

### Task 0.2 — Fix Vault Detail Page (`app/vault/[id]/page.tsx`)

**Problem:** Same `useEffect` closure bug. Also wrong service call signatures and type mismatches.

**Fix Steps:**
1. Close the `useEffect` properly after `loadVaultData()` (add missing `});` around line 53)
2. Move `handleAddSource`, `handleDeleteSource`, `handleFileUploadComplete` out of `useEffect`
3. Fix `sourceService.createSource(...)` — service expects `(vaultId, url, title?, metadata?)` positional args, not an object. Change from:
   ```ts
   sourceService.createSource({ vaultId, url, title, sourceType, author, publicationDate, content, metadata })
   ```
   to:
   ```ts
   sourceService.createSource(vaultId, newSourceUrl, newSourceUrl, {})
   ```
4. Unwrap `ApiResponse` from all service calls (`getVaultById`, `getSourcesByVault`, `createSource`, `deleteSource`)
5. Fix `source.createdAt` → `source.created_at` (line ~289)
6. Remove reference to `source.author` (doesn't exist on DB `Source` type — author info is in `metadata`)

### Task 0.3 — Fix VaultCard Component

**File:** `components/vault-card.tsx`

**Fix:**
- Change `vault.createdAt` → `vault.created_at` (line ~56)

### Task 0.4 — Fix FileUploader Import Path

**File:** `components/file-uploader.tsx`

**Fix:**
- Change `import { fileService } from '@/lib/file.service'` → `import { fileService } from '@/lib/services/file.service'`

### Task 0.5 — Fix File Service (`lib/services/file.service.ts`)

**Fix:**
- Remove the `import crypto from 'crypto'` line (Node.js module, crashes in browser)
- Remove or stub the `calculateChecksum` method (the `file-uploader.tsx` already does checksums correctly using browser `crypto.subtle`)

### Task 0.6 — Unify Type System

**Decision:** Use `database.types.ts` (snake_case) as the single source of truth. Deprecate `types.ts`.

**Steps:**
1. Add any missing display-oriented types to `database.types.ts` as extension interfaces:
   ```ts
   // Extended types for UI display (joins DB data with computed fields)
   export interface VaultWithMeta extends Vault {
     member_count?: number;
     source_count?: number;
     file_count?: number;
     user_role?: 'owner' | 'contributor' | 'viewer';
   }

   export interface SourceWithAnnotations extends Source {
     annotation_count?: number;
   }

   export interface AnnotationWithAuthor extends Annotation {
     author_email?: string;
     author_name?: string;
   }

   export interface ActivityLogWithActor extends ActivityLog {
     actor_email?: string;
     actor_name?: string;
   }

   export interface FileWithUploader extends DBFile {
     uploader_email?: string;
     uploader_name?: string;
   }
   ```
2. Update `RoleBadge` to use DB roles: `'owner' | 'contributor' | 'viewer'` (remove `editor` and `reviewer`)
3. Update `ActivityFeed` to use `ActivityLog` / `ActivityLogWithActor` type
4. Update `AnnotationItem` to use `AnnotationWithAuthor` type
5. Update `SourceItem` to use `Source` from `database.types.ts`
6. Update `FileListPanel` to use `File` / `FileWithUploader` from `database.types.ts`
7. Keep `lib/types.ts` but mark as deprecated — remove imports from all active files

### Task 0.7 — Fix RoleBadge Roles

**File:** `components/role-badge.tsx`

**Fix:**
- Replace role map: `editor` → `contributor`, remove `reviewer`
- Update `Role` type to `'owner' | 'contributor' | 'viewer'`

### Task 0.8 — Verify Compilation

- Run `npx next build` (or at minimum `npx tsc --noEmit`) to confirm zero compile errors
- Note: `next.config.mjs` has `ignoreBuildErrors: true` — keep this for now but don't rely on it

---

## Phase 1 — Vault Dashboard & CRUD

> **Goal:** Fully working dashboard showing user's vaults with create, read, update, delete operations.
> **Estimated effort:** 4–5 hours
> **Depends on:** Phase 0

### Task 1.1 — Rebuild Dashboard Page

**File:** `app/dashboard/page.tsx` (rewrite after Phase 0 fixes)

**Requirements:**
- Fetch vaults using `vaultService.getAllVaults()` — properly unwrap `ApiResponse`
- Show loading skeleton (`VaultCardSkeleton`) during fetch
- Display vaults in responsive grid (1col mobile, 2col tablet, 3col desktop)
- Each vault card shows: name, description (truncated), created date, member count, role badge
- Empty state: illustration + "Create your first vault" CTA
- Error state: retry button
- Navigation: clicking a vault → `/vault/[id]`

**New Feature — Vault Stats:**
- Create a new service method `vaultService.getVaultStats(vaultId)` that returns member count, source count, file count
- OR batch this into `getAllVaults` with a Supabase join/count query:
  ```sql
  select *, 
    (select count(*) from vault_members where vault_id = vaults.id) as member_count,
    (select count(*) from sources where vault_id = vaults.id) as source_count
  from vaults
  ```

**New Feature — User's Role per Vault:**
- After fetching vaults, also fetch the current user's membership role for each vault
- Display role badge (Owner/Contributor/Viewer) on each vault card
- This requires joining `vault_members` with the current user's ID

### Task 1.2 — Enhanced VaultCard Component

**File:** `components/vault-card.tsx` (update)

**Display:**
- Vault name with folder icon
- Description (2-line clamp)
- Stats row: `{source_count} sources · {member_count} members`
- Role badge in top-right corner (Owner/Contributor/Viewer)
- Created date in relative format ("2 days ago" using `date-fns`)
- Delete button ONLY visible to owners (role-based, see Phase 3)
- Hover effect with subtle shadow elevation

### Task 1.3 — Dashboard Header

**New in dashboard page:**
- App logo + "SyncScript" branding
- User avatar/initials + email
- Settings link → `/settings`
- Sign out button
- "Create Vault" primary action button

### Task 1.4 — Search & Filter (Enhancement)

**Optional but recommended:**
- Search bar to filter vaults by name/description (client-side filter)
- Sort options: "Newest first", "Oldest first", "A-Z"
- Could add archived filter toggle later

---

## Phase 2 — Sources & Annotations List

> **Goal:** Build the vault detail page showing sources and their annotations, plus a source detail page.
> **Estimated effort:** 6–8 hours
> **Depends on:** Phase 0, Phase 1

### Task 2.1 — Rebuild Vault Detail Page

**File:** `app/vault/[id]/page.tsx` (rewrite after Phase 0 fixes)

**Layout — Two-Panel Design:**
```
┌─────────────────────────────────────────────┐
│  ← Back   Vault Name          [Members] [⚙] │
│            3 sources · 2 members             │
├─────────────────┬───────────────────────────┤
│                 │                           │
│  Sources List   │  Source Detail / Preview  │
│  (left panel)   │  (right panel)            │
│                 │                           │
│  + Add Source   │  Annotations list         │
│  + Upload File  │  + Add Annotation         │
│                 │                           │
└─────────────────┴───────────────────────────┘
```

Use `react-resizable-panels` (already in dependencies) for the two-panel layout.

**Left Panel — Sources List:**
- List all sources for the vault via `sourceService.getSourcesByVault(vaultId)`
- Each source shows: title (or URL if no title), type indicator (URL/file), created date
- Clicking a source → loads detail in right panel (or navigates to source detail page on mobile)
- "Add Source" button at top
- "Upload File" button at top

**Right Panel — Source Detail:**
- When a source is selected, show:
  - Source title, URL (clickable), metadata
  - If PDF file → PDF preview area (Phase 6)
  - Annotations list below
  - "Add Annotation" form

### Task 2.2 — Create Source Detail Page

**New file:** `app/vault/[id]/source/[sourceId]/page.tsx`

This page is referenced by the vault detail page but doesn't exist. Create it.

**Content:**
- Full source details: title, URL, type, metadata, version, created date
- Annotations list via `annotationService.getAnnotationsBySource(sourceId)`
- Add annotation form (text input + submit)
- Edit/delete annotation (inline editing)
- Back button → `/vault/[id]`
- PDF preview if the source is a file (Phase 6 integration point)

### Task 2.3 — Rebuild AnnotationItem Component

**File:** `components/annotation-item.tsx` (rewrite to use DB types)

**Updated Props:**
```ts
interface AnnotationItemProps {
  annotation: AnnotationWithAuthor;  // from database.types.ts
  currentUserId: string;
  userRole: 'owner' | 'contributor' | 'viewer';
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}
```

**Display:**
- Author avatar (initials from email) + name/email
- Annotation content (markdown support if possible, plain text minimum)
- Version badge (`v{version}`)
- Timestamp in relative format
- Edit/Delete buttons only for the annotation creator OR vault owner (role-based)

### Task 2.4 — Rebuild SourceItem Component

**File:** `components/source-item.tsx` (rewrite to use DB types)

**Updated Props:**
```ts
interface SourceItemProps {
  source: Source;                    // from database.types.ts
  isSelected?: boolean;
  userRole: 'owner' | 'contributor' | 'viewer';
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}
```

**Display:**
- Source title (or truncated URL)
- Type indicator icon (link icon for URLs, file icon for uploads)
- Metadata preview (author, journal if available in metadata JSON)
- Created date
- Click to select
- Delete button (role-permissioned)

### Task 2.5 — Rebuild ActivityFeed Component

**File:** `components/activity-feed.tsx` (rewrite to use DB types)

**Updated Props:**
```ts
interface ActivityFeedProps {
  activities: ActivityLogWithActor[];
  maxItems?: number;
}
```

**Display:**
- Chronological list of activity entries
- Each entry: actor avatar/initials, action description, target, relative timestamp
- Action type mapped to human-readable text:
  - `source_created` → "added a new source"
  - `source_updated` → "updated a source"
  - `source_deleted` → "removed a source"
  - `annotation_created` → "added an annotation"
  - `annotation_updated` → "edited an annotation"
  - `annotation_deleted` → "removed an annotation"
  - `file_uploaded` → "uploaded a file"
  - `file_deleted` → "removed a file"
  - `member_added` → "added a member"
  - `member_removed` → "removed a member"
  - `member_role_changed` → "changed a member's role"
- Details extracted from `metadata` JSON field

### Task 2.6 — Rebuild FileListPanel Component

**File:** `components/file-list-panel.tsx` (rewrite to use DB types)

**Updated Props:**
```ts
interface FileListPanelProps {
  files: FileWithUploader[];
  userRole: 'owner' | 'contributor' | 'viewer';
  onDelete?: (fileId: string, fileName: string) => void;
  onPreview?: (fileId: string) => void;
}
```

**Display:**
- File name with type icon (derive from extension: `.pdf`, `.docx`, `.csv`, etc.)
- File size (formatted: KB/MB)
- Uploaded by (name/email)
- Upload date
- Download link (via signed URL from `fileService.getSignedUrl`)
- Delete button (role-permissioned)

### Task 2.7 — Add Service Method for Getting User Info

**Problem:** `vault_members`, `activity_logs`, etc. only store `user_id` (UUID). To display names/emails, we need to resolve these.

**Solution — Create a user resolution utility:**

**New file:** `lib/services/user.service.ts`

```ts
export const userService = {
  // Cache to avoid repeated lookups
  cache: new Map<string, { email: string; name?: string }>(),

  async getUserById(userId: string): Promise<{ email: string; name?: string } | null> { ... },
  async getUsersByIds(userIds: string[]): Promise<Map<string, { email: string; name?: string }>> { ... },
}
```

**Note:** Supabase `auth.users` is not directly queryable from client. Options:
1. **Create a `profiles` table** (add migration `003_create_profiles.sql`) with `id`, `email`, `display_name`, `avatar_url` — auto-populated via Supabase trigger on user signup
2. **Use a server API route** (`/api/users/[id]`) that queries `auth.admin.getUserById()` using service role
3. **Store denormalized user info** in `vault_members` table (add `email`, `display_name` columns)

**Recommended: Option 1** — Create a `profiles` table with a trigger. This is the standard Supabase pattern and the hook `useUserProfile` already expects it.

**New migration:** `supabase/migrations/003_create_profiles.sql`
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

---

## Phase 3 — Dynamic Role-Based UI

> **Goal:** UI adapts based on user's role (Owner/Contributor/Viewer) in each vault.
> **Estimated effort:** 4–5 hours
> **Depends on:** Phase 1, Phase 2

### Task 3.1 — Create Role Context/Hook

**New file:** `hooks/use-vault-role.ts`

```ts
export function useVaultRole(vaultId: string) {
  // Returns: { role: 'owner' | 'contributor' | 'viewer' | null, loading: boolean }
  // Fetches current user's membership from vault_members table
  // Caches the result for the session
}
```

**Implementation:**
- Call `vaultService.getVaultMembers(vaultId)` 
- Find the current user's entry (match `user_id` with `auth.getUser().id`)
- Return their `role`
- If user is not a member, return `null` (redirect or show "access denied")

### Task 3.2 — Define Permission Matrix

Create a permissions utility:

**New file:** `lib/permissions.ts`

```ts
export type Permission = 
  | 'vault:edit'          // Edit vault name/description
  | 'vault:delete'        // Delete vault
  | 'vault:manage_members'// Add/remove/change member roles
  | 'source:create'       // Add sources
  | 'source:edit'         // Edit sources
  | 'source:delete'       // Delete any source (own sources deletable by creator)
  | 'annotation:create'   // Add annotations
  | 'annotation:edit'     // Edit own annotations
  | 'annotation:delete'   // Delete any annotation
  | 'file:upload'         // Upload files
  | 'file:delete'         // Delete any file
  | 'file:download'       // Download files

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [ALL],
  contributor: ['source:create', 'source:edit', 'annotation:create', 'annotation:edit', 'file:upload', 'file:download'],
  viewer: ['file:download'],
};

export function hasPermission(role: string, permission: Permission): boolean { ... }
export function usePermission(vaultId: string, permission: Permission): boolean { ... }
```

### Task 3.3 — Apply Role-Based Visibility

**Dashboard Page:**
- Delete vault button → only visible to `owner`
- "Create Vault" available to all authenticated users (creating makes you owner)

**Vault Detail Page:**
- "Add Source" button → visible to `owner` and `contributor`
- "Upload File" button → visible to `owner` and `contributor`
- Delete source button → visible to `owner` (can delete any) and `contributor` (can delete own)
- "Manage Members" button → visible to `owner` only
- Settings gear icon → visible to `owner` only

**Source Detail Page:**
- "Add Annotation" form → visible to `owner` and `contributor`
- Edit annotation → visible to the annotation creator AND `owner`
- Delete annotation → visible to the annotation creator AND `owner`

**Vault Members Panel:**
- "Add Member" → `owner` only
- "Change Role" dropdown → `owner` only
- "Remove Member" → `owner` only

### Task 3.4 — Role Badge Updates

**File:** `components/role-badge.tsx`

**Updated roles with colors:**
```
owner       → Blue badge with crown/shield icon
contributor → Green badge with pencil icon  
viewer      → Gray badge with eye icon
```

### Task 3.5 — Access Denied State

Create a reusable component for when a user tries to access a vault they're not a member of:

**New file:** `components/access-denied.tsx`

- "You don't have access to this vault"
- "Request access" button (optional — could email owner)
- "Go back to dashboard" link

---

## Phase 4 — Modals & Forms

> **Goal:** Create polished modal dialogs for all CRUD operations instead of inline forms.
> **Estimated effort:** 5–6 hours
> **Depends on:** Phase 1, Phase 2, Phase 3

### Task 4.1 — Create Vault Modal

**New file:** `components/modals/create-vault-modal.tsx`

**Uses:** shadcn `Dialog` component (already installed)

**Fields:**
- Vault name (required, text input, max 100 chars)
- Description (optional, textarea, max 500 chars)

**Behavior:**
- Opens from dashboard "Create Vault" button
- Form validation with `react-hook-form` + `zod` (both in dependencies)
- On submit: call `vaultService.createVault(name, description)`
- Loading state during submission
- Success: close modal, add new vault to list, show toast
- Error: inline error message

**Zod schema:**
```ts
const createVaultSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});
```

### Task 4.2 — Edit Vault Modal

**New file:** `components/modals/edit-vault-modal.tsx`

**Fields:**
- Vault name (pre-filled)
- Description (pre-filled)

**Behavior:**
- Opens from vault settings/edit button (owner only)
- On submit: call `vaultService.updateVault(vaultId, { name, description })`
- Success: update vault in state, show toast

### Task 4.3 — Delete Vault Confirmation Modal

**New file:** `components/modals/delete-vault-modal.tsx`

**Uses:** shadcn `AlertDialog` component

**Content:**
- Warning icon
- "Are you sure you want to delete this vault?"
- "This will permanently delete all sources, annotations, and files. This action cannot be undone."
- Type vault name to confirm (safety measure)
- Cancel / Delete buttons

### Task 4.4 — Add Source Modal

**New file:** `components/modals/add-source-modal.tsx`

**Two modes (tabs):**

**Tab 1 — Add by URL:**
- URL input (required)
- Title (optional — auto-filled from citation service if DOI detected)
- "Auto-detect citation" button that calls `/api/citation/generate` for DOI URLs
- Metadata fields (optional): author, journal, year

**Tab 2 — Upload File:**
- Drag & drop area (reuse `FileUploader` component)
- File name gets used as source title

**On submit:**
- URL tab: `sourceService.createSource(vaultId, url, title, metadata)`
- File tab: `fileService.uploadFile(...)` then `sourceService.createSource(...)` with file reference

### Task 4.5 — Add Annotation Modal/Inline Form

**New file:** `components/modals/add-annotation-form.tsx`

**This can be inline (not a modal) for better UX:**
- Textarea for annotation content
- Submit button
- Cancel button
- Calls `annotationService.createAnnotation(sourceId, content)`

### Task 4.6 — Edit Annotation Modal

**New file:** `components/modals/edit-annotation-modal.tsx`

**Fields:**
- Content textarea (pre-filled)

**On submit:** `annotationService.updateAnnotation(annotationId, content)`

### Task 4.7 — Manage Members Modal

**New file:** `components/modals/manage-members-modal.tsx`

**This is a key modal with multiple sections:**

**Section 1 — Current Members List:**
- Each member: avatar, name/email, role badge, role dropdown (owner only can change), remove button
- Owner role change: dropdown with `owner`, `contributor`, `viewer`
- API: `vaultService.updateMemberRole(vaultId, userId, newRole)`
- Remove: `vaultService.removeVaultMember(vaultId, userId)` with confirmation
- Cannot remove last owner (service already prevents this)

**Section 2 — Add Member:**
- Email input to invite a new member
- Role selector: `contributor` or `viewer` (default: `contributor`)
- API to add: need to look up user by email first
  - **New service method needed:** `userService.getUserByEmail(email)` — queries `profiles` table
  - Then: `vaultService.addVaultMember(vaultId, userId, role)`
- Error handling: "User not found", "Already a member"

### Task 4.8 — Delete Source Confirmation

**New file:** `components/modals/delete-source-modal.tsx`

- Simple `AlertDialog`: "Delete this source and all its annotations?"
- Confirm / Cancel

### Task 4.9 — Create Form Validation Schemas

**New file:** `lib/validations.ts`

Centralized Zod schemas for all forms:
```ts
export const createVaultSchema = z.object({...});
export const editVaultSchema = z.object({...});
export const addSourceSchema = z.object({...});
export const addAnnotationSchema = z.object({...});
export const addMemberSchema = z.object({...});
```

---

## Phase 5 — Real-Time Updates Integration

> **Goal:** Wire up Supabase Realtime subscriptions so all changes appear instantly without page refresh.
> **Estimated effort:** 4–5 hours
> **Depends on:** Phase 2

### Task 5.1 — Enable Supabase Realtime on Tables

**Prerequisite:** Ensure Realtime is enabled for the required tables in Supabase dashboard:
- Go to Supabase → Database → Replication
- Enable Realtime for: `vaults`, `vault_members`, `sources`, `annotations`, `files`, `activity_logs`

Alternatively, add a migration:
```sql
-- 004_enable_realtime.sql
ALTER PUBLICATION supabase_realtime ADD TABLE vaults;
ALTER PUBLICATION supabase_realtime ADD TABLE vault_members;
ALTER PUBLICATION supabase_realtime ADD TABLE sources;
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
```

### Task 5.2 — Integrate Realtime into Vault Detail Page

**Use the existing hooks:** `useRealtimeSources`, `useRealtimeMembers`, `useRealtimeActivityLog`

**Integration pattern in `app/vault/[id]/page.tsx`:**
```tsx
// Initial data fetch
const [sources, setSources] = useState<Source[]>([]);

useEffect(() => {
  // Fetch initial sources
  const loadSources = async () => {
    const response = await sourceService.getSourcesByVault(vaultId);
    if (response.data) setSources(response.data);
  };
  loadSources();
}, [vaultId]);

// Real-time subscription
useEffect(() => {
  const unsubscribe = realtimeService.subscribeToSources(vaultId, (event) => {
    if (event.type === 'source_added') {
      setSources(prev => [event.payload.new, ...prev]);
    } else if (event.type === 'source_updated') {
      setSources(prev => prev.map(s => s.id === event.payload.new.id ? event.payload.new : s));
    } else if (event.type === 'source_deleted') {
      setSources(prev => prev.filter(s => s.id !== event.payload.old.id));
    }
  });

  return unsubscribe;
}, [vaultId]);
```

**Apply same pattern for:**
- Members list (subscribe to `vault_members` changes)
- Activity feed (subscribe to `activity_logs` inserts)
- Files list (subscribe to `files` changes)

### Task 5.3 — Integrate Realtime into Source Detail Page

**For annotations on a specific source:**
```tsx
useEffect(() => {
  const unsubscribe = realtimeService.subscribeToAnnotations(sourceId, (event) => {
    if (event.type === 'annotation_added') {
      setAnnotations(prev => [...prev, event.payload.new]);
    } else if (event.type === 'annotation_updated') {
      setAnnotations(prev => prev.map(a => a.id === event.payload.new.id ? event.payload.new : a));
    } else if (event.type === 'annotation_deleted') {
      setAnnotations(prev => prev.filter(a => a.id !== event.payload.old.id));
    }
  });
  return unsubscribe;
}, [sourceId]);
```

### Task 5.4 — Integrate Realtime into Dashboard

**Subscribe to vault changes for the current user:**
- When another user creates/updates/deletes a vault where the current user is a member, the dashboard should update
- Subscribe to `vault_members` changes where `user_id` matches current user → refresh vault list
- This is trickier because we need to filter by user — may need a different approach:
  - Option A: Subscribe to ALL vault changes and filter client-side
  - Option B: Periodically poll (less ideal)
  - **Recommended: Option A** with `vault_members` subscription filtered by `user_id`

### Task 5.5 — Visual Feedback for Realtime Events

**New file:** `components/realtime-indicator.tsx`

- Small indicator showing connection status (connected/disconnected/reconnecting)
- Place in vault detail page header
- Green dot = connected, yellow = reconnecting, red = disconnected

**Toast notifications for significant events:**
- When another user adds a source → toast: "John added a new source: {title}"
- When another user adds an annotation → toast: "Jane added an annotation"
- When a member is added/removed → toast: "New member added to vault"
- Distinguish between own actions (no toast) and others' actions (show toast)

### Task 5.6 — Optimistic Updates

For better UX, implement optimistic updates for CRUD operations:

**Pattern:**
```tsx
const handleAddSource = async (url: string, title: string) => {
  // 1. Optimistically add to UI with temporary ID
  const tempSource = { id: `temp-${Date.now()}`, url, title, ... };
  setSources(prev => [tempSource, ...prev]);

  // 2. Call API
  const response = await sourceService.createSource(vaultId, url, title);

  // 3. If success: replace temp item with real item (realtime might handle this)
  // 4. If error: remove temp item, show error toast
  if (response.status === 'error') {
    setSources(prev => prev.filter(s => s.id !== tempSource.id));
    toast.error('Failed to add source');
  }
};
```

---

## Phase 6 — File Upload Interface

> **Goal:** Complete file upload with drag-and-drop, signed URLs, progress tracking, and PDF preview.
> **Estimated effort:** 4–5 hours
> **Depends on:** Phase 0, Phase 2

### Task 6.1 — Fix FileUploader Component

**File:** `components/file-uploader.tsx`

**Current issues to fix:**
1. Fix import: `@/lib/file.service` → `@/lib/services/file.service`
2. Add upload progress indicator (Supabase Storage supports progress tracking)
3. Add file type validation (accept only PDF, DOCX, CSV, XLSX, PNG, JPG)
4. Add file size limit (e.g., 50MB max)

### Task 6.2 — Create Supabase Storage Bucket

**Migration or manual setup:**
- Create a `vault-files` bucket in Supabase Storage
- Set bucket policies:
  - Insert: authenticated users who are vault members
  - Select: authenticated users who are vault members
  - Delete: file uploader or vault owner

**New migration:** `supabase/migrations/005_storage_bucket.sql`
```sql
-- Create storage bucket for vault files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vault-files', 'vault-files', false);

-- Storage policies
CREATE POLICY "Vault members can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM vault_members 
      WHERE vault_id = (storage.foldername(name))[1]::uuid
      AND role IN ('owner', 'contributor')
    )
  );

CREATE POLICY "Vault members can view" ON storage.objects
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM vault_members 
      WHERE vault_id = (storage.foldername(name))[1]::uuid
    )
  );

CREATE POLICY "Owners can delete" ON storage.objects
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM vault_members 
      WHERE vault_id = (storage.foldername(name))[1]::uuid
      AND role = 'owner'
    )
    OR auth.uid() = owner
  );
```

### Task 6.3 — Signed URL Download

**When a user clicks a file to download or preview:**
1. Call `fileService.getSignedUrl(vaultId, fileName, 3600)` (1-hour expiry)
2. Open the signed URL in a new tab or embed in preview

### Task 6.4 — Upload Progress UI

**Enhancement to FileUploader:**
- Show progress bar during upload (0-100%)
- Show file icon + name during upload
- Show checksum calculation step ("Verifying integrity...")
- Show upload step ("Uploading to vault...")
- Show completion ("File uploaded successfully ✓")
- Error state with retry button

### Task 6.5 — PDF Preview Component

**File:** `components/pdf-preview.tsx` (rewrite — currently entirely hardcoded mock)

**Options:**
1. **Embed via iframe** — simplest, use signed URL in an `<iframe>`:
   ```tsx
   <iframe src={signedUrl} className="w-full h-full" />
   ```
2. **Use `react-pdf`** — install `react-pdf` for page-by-page rendering with annotations overlay
3. **Use browser native** — `<object>` or `<embed>` tag with PDF URL

**Recommended: Option 1 (iframe)** for MVP. It works in all modern browsers and requires no additional dependencies.

**Implementation:**
```tsx
interface PdfPreviewProps {
  fileId: string;
  vaultId: string;
  fileName: string;
}

export function PdfPreview({ fileId, vaultId, fileName }: PdfPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUrl = async () => {
      const result = await fileService.getSignedUrl(vaultId, fileName);
      if (result.url) setUrl(result.url);
      setLoading(false);
    };
    loadUrl();
  }, [vaultId, fileName]);

  if (loading) return <Skeleton />;
  if (!url) return <p>Unable to load preview</p>;

  return <iframe src={url} className="w-full h-[80vh] border rounded" />;
}
```

### Task 6.6 — File List in Vault Detail

**Integration point in vault detail page:**
- Add a "Files" tab alongside "Sources" tab
- Show all files via `fileService.getFilesByVault(vaultId)`
- Each file: name, size, uploaded by, date, download button, delete button (role-permissioned)
- Clicking a PDF file opens the `PdfPreview` component

---

## Phase 7 — Notification UI

> **Goal:** In-app notification system that alerts users when contributors are added or sources are updated.
> **Estimated effort:** 4–5 hours
> **Depends on:** Phase 5 (Realtime)

### Task 7.1 — Create Notifications Table

**New migration:** `supabase/migrations/006_notifications.sql`

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  type TEXT NOT NULL,        -- 'member_added', 'source_updated', 'annotation_added', etc.
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System creates notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Task 7.2 — Create Notification Service

**New file:** `lib/services/notification.service.ts`

```ts
export const notificationService = {
  async getNotifications(limit?: number): Promise<PaginatedResponse<Notification>> { ... },
  async getUnreadCount(): Promise<number> { ... },
  async markAsRead(notificationId: string): Promise<void> { ... },
  async markAllAsRead(): Promise<void> { ... },
  async deleteNotification(notificationId: string): Promise<void> { ... },
}
```

### Task 7.3 — Create Notification Triggers

**Option A — Database triggers (recommended for reliability):**

**New migration:** `supabase/migrations/007_notification_triggers.sql`

```sql
-- Trigger: when a member is added to a vault, notify them
CREATE OR REPLACE FUNCTION notify_member_added()
RETURNS TRIGGER AS $$
DECLARE
  vault_name TEXT;
BEGIN
  SELECT name INTO vault_name FROM vaults WHERE id = NEW.vault_id;
  
  INSERT INTO notifications (user_id, vault_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    NEW.vault_id,
    'member_added',
    'Added to vault',
    'You have been added to "' || vault_name || '" as ' || NEW.role,
    jsonb_build_object('role', NEW.role, 'vault_name', vault_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_member_added
  AFTER INSERT ON vault_members
  FOR EACH ROW EXECUTE FUNCTION notify_member_added();

-- Trigger: when a source is added, notify all vault members except the actor
CREATE OR REPLACE FUNCTION notify_source_added()
RETURNS TRIGGER AS $$
DECLARE
  vault_name TEXT;
  member RECORD;
BEGIN
  SELECT name INTO vault_name FROM vaults WHERE id = NEW.vault_id;
  
  FOR member IN SELECT user_id FROM vault_members WHERE vault_id = NEW.vault_id AND user_id != NEW.created_by
  LOOP
    INSERT INTO notifications (user_id, vault_id, type, title, message, metadata)
    VALUES (
      member.user_id,
      NEW.vault_id,
      'source_added',
      'New source added',
      'A new source was added to "' || vault_name || '"',
      jsonb_build_object('source_id', NEW.id, 'source_title', COALESCE(NEW.title, NEW.url))
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_source_added
  AFTER INSERT ON sources
  FOR EACH ROW EXECUTE FUNCTION notify_source_added();

-- Trigger: when a source is updated, notify vault members
CREATE OR REPLACE FUNCTION notify_source_updated()
RETURNS TRIGGER AS $$
DECLARE
  vault_name TEXT;
  member RECORD;
  actor_id UUID;
BEGIN
  SELECT name INTO vault_name FROM vaults WHERE id = NEW.vault_id;
  actor_id := auth.uid();
  
  FOR member IN SELECT user_id FROM vault_members WHERE vault_id = NEW.vault_id AND user_id != actor_id
  LOOP
    INSERT INTO notifications (user_id, vault_id, type, title, message, metadata)
    VALUES (
      member.user_id,
      NEW.vault_id,
      'source_updated',
      'Source updated',
      'A source was updated in "' || vault_name || '"',
      jsonb_build_object('source_id', NEW.id, 'source_title', COALESCE(NEW.title, NEW.url))
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_source_updated
  AFTER UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION notify_source_updated();
```

### Task 7.4 — Notification Bell Component

**New file:** `components/notification-bell.tsx`

**Placement:** Dashboard header and vault detail header

**UI:**
- Bell icon with unread count badge (red circle with number)
- Click opens a dropdown/popover with notification list
- Each notification: icon (by type), title, message, relative timestamp, read/unread indicator
- "Mark all as read" button at top
- Click a notification → navigate to the relevant vault/source
- "View all" link → could open a full notifications page (optional)

### Task 7.5 — Notification Realtime Hook

**New file:** `hooks/use-notifications.ts`

```ts
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initial fetch
  useEffect(() => {
    notificationService.getNotifications(20).then(res => {
      setNotifications(res.data);
    });
    notificationService.getUnreadCount().then(setUnreadCount);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Show toast for new notification
        toast.info(payload.new.title, { description: payload.new.message });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
```

### Task 7.6 — Toast Notifications for Realtime Events

**Integration with existing `sonner` toast library:**

When realtime events fire (from Phase 5), show toasts:
- New member added: "👤 John was added to your vault"
- Source added by another user: "📄 New source: {title}"
- Source updated: "📝 Source updated: {title}"
- File uploaded: "📎 New file: {filename}"

**Important:** Only show toasts for actions by OTHER users, not the current user.

---

## Phase 8 — Responsive Design & Polish

> **Goal:** Ensure full responsiveness and polish the UI.
> **Estimated effort:** 3–4 hours
> **Depends on:** All previous phases

### Task 8.1 — Mobile Layout

**Dashboard:**
- Single column vault cards on mobile
- Hamburger menu for navigation
- Bottom sheet for "Create Vault" instead of modal on mobile

**Vault Detail:**
- Stack panels vertically instead of side-by-side
- Sources list → full width
- Clicking a source → navigates to source detail page (not side panel)
- Use the `useIsMobile()` hook (already implemented in `hooks/use-mobile.tsx`)

### Task 8.2 — Responsive Breakpoints

Follow Tailwind's default breakpoints:
- `sm`: 640px — single column
- `md`: 768px — 2 columns, side panels
- `lg`: 1024px — full desktop layout
- `xl`: 1280px — max-width containers

### Task 8.3 — Dark Mode Support

1. Wrap app with `ThemeProvider` in `app/layout.tsx` (component exists, just not used)
2. Add theme toggle button in header (sun/moon icon)
3. All HSL CSS variables already defined in `globals.css` for both themes
4. Test all components in dark mode

### Task 8.4 — Loading States

- Use `VaultCardSkeleton` during vault loading (already built, just unused)
- Create `SourceListSkeleton` for source loading
- Create `AnnotationSkeleton` for annotation loading
- Show skeleton screens instead of plain spinners

### Task 8.5 — Error Boundaries

**New file:** `components/error-boundary.tsx`

- Catch render errors gracefully
- Show "Something went wrong" with retry button
- Log errors to console / future error tracking

### Task 8.6 — Empty States

Create consistent empty state illustrations for:
- No vaults → "Create your first vault to start collaborating"
- No sources → "Add your first source — paste a URL or upload a file"
- No annotations → "Be the first to annotate this source"
- No files → "Upload files to share with your team"
- No notifications → "You're all caught up!"

### Task 8.7 — Accessibility

- Ensure all interactive elements have `aria-label`
- Keyboard navigation for modals (focus trap)
- Color contrast meets WCAG AA
- Screen reader support for notifications (aria-live regions)

---

## Deliverables Checklist

### Fully Responsive, Role-Based UI

- [ ] **Phase 0:** All compile errors fixed, type system unified
- [ ] **Phase 1:** Dashboard with vault grid, create/delete, stats, role badges
- [ ] **Phase 2:** Vault detail with sources list, source detail page, annotations, activity feed
- [ ] **Phase 3:** Role-based visibility (Owner/Contributor/Viewer) on all actions
- [ ] **Phase 4:** Modals for create vault, edit vault, delete vault, add source, add annotation, manage members
- [ ] **Phase 6:** File upload with drag-drop, progress, signed URLs, PDF preview
- [ ] **Phase 8:** Mobile responsive, dark mode, loading skeletons, empty states

### Realtime Updates Working with Subscriptions

- [ ] **Phase 5:** Supabase Realtime enabled on all tables
- [ ] **Phase 5:** Sources list auto-updates when another user adds/edits/deletes
- [ ] **Phase 5:** Annotations auto-update in real-time
- [ ] **Phase 5:** Members list reflects changes instantly
- [ ] **Phase 5:** Activity feed streams new events live
- [ ] **Phase 5:** Connection status indicator
- [ ] **Phase 7:** Notification system with DB triggers
- [ ] **Phase 7:** Notification bell with unread count and dropdown
- [ ] **Phase 7:** Toast notifications for real-time events from other users

---

## File Inventory — New & Modified Files

### New Files to Create

| File | Phase | Purpose |
|------|-------|---------|
| `supabase/migrations/003_create_profiles.sql` | Phase 2 | User profiles table + auto-create trigger |
| `supabase/migrations/004_enable_realtime.sql` | Phase 5 | Enable Realtime on all tables |
| `supabase/migrations/005_storage_bucket.sql` | Phase 6 | Storage bucket + policies |
| `supabase/migrations/006_notifications.sql` | Phase 7 | Notifications table + RLS |
| `supabase/migrations/007_notification_triggers.sql` | Phase 7 | Auto-generate notifications on events |
| `app/vault/[id]/source/[sourceId]/page.tsx` | Phase 2 | Source detail page |
| `lib/services/user.service.ts` | Phase 2 | User lookup + caching |
| `lib/services/notification.service.ts` | Phase 7 | Notification CRUD |
| `lib/permissions.ts` | Phase 3 | Permission matrix + helpers |
| `lib/validations.ts` | Phase 4 | Zod schemas for all forms |
| `hooks/use-vault-role.ts` | Phase 3 | Get current user's role in a vault |
| `hooks/use-notifications.ts` | Phase 7 | Notifications state + realtime |
| `components/modals/create-vault-modal.tsx` | Phase 4 | Create vault dialog |
| `components/modals/edit-vault-modal.tsx` | Phase 4 | Edit vault dialog |
| `components/modals/delete-vault-modal.tsx` | Phase 4 | Delete confirmation dialog |
| `components/modals/add-source-modal.tsx` | Phase 4 | Add source dialog (URL + file tabs) |
| `components/modals/add-annotation-form.tsx` | Phase 4 | Inline annotation form |
| `components/modals/edit-annotation-modal.tsx` | Phase 4 | Edit annotation dialog |
| `components/modals/manage-members-modal.tsx` | Phase 4 | Member management dialog |
| `components/modals/delete-source-modal.tsx` | Phase 4 | Delete source confirmation |
| `components/notification-bell.tsx` | Phase 7 | Bell icon + dropdown |
| `components/realtime-indicator.tsx` | Phase 5 | Connection status dot |
| `components/access-denied.tsx` | Phase 3 | Access denied screen |
| `components/error-boundary.tsx` | Phase 8 | React error boundary |

### Existing Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `app/dashboard/page.tsx` | Phase 0, 1 | Fix syntax bug, unwrap ApiResponse, add role display, use modals |
| `app/vault/[id]/page.tsx` | Phase 0, 2 | Fix syntax bug, fix service calls, add two-panel layout, integrate realtime |
| `app/settings/page.tsx` | Phase 1 | Wire up real profile update via `useUserProfile` |
| `app/layout.tsx` | Phase 8 | Add ThemeProvider, notification context |
| `components/vault-card.tsx` | Phase 0, 1 | Fix `createdAt`, add stats + role badge |
| `components/file-uploader.tsx` | Phase 0, 6 | Fix import, add progress bar |
| `components/activity-feed.tsx` | Phase 2 | Rewrite for DB types |
| `components/annotation-item.tsx` | Phase 2 | Rewrite for DB types + role-based actions |
| `components/source-item.tsx` | Phase 2 | Rewrite for DB types |
| `components/file-list-panel.tsx` | Phase 2 | Rewrite for DB types |
| `components/role-badge.tsx` | Phase 0, 3 | Update to DB roles (owner/contributor/viewer) |
| `components/pdf-preview.tsx` | Phase 6 | Replace mock with signed-URL iframe |
| `lib/database.types.ts` | Phase 0 | Add extended types (VaultWithMeta, etc.) |
| `lib/services/file.service.ts` | Phase 0 | Remove Node.js crypto import |
| `hooks/use-realtime.ts` | Phase 5 | Verify and potentially enhance |

---

## Estimated Total Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 0 — Bug Fixes & Types | 3–4 hrs | 🔴 Critical |
| Phase 1 — Vault Dashboard | 4–5 hrs | 🔴 Critical |
| Phase 2 — Sources & Annotations | 6–8 hrs | 🔴 Critical |
| Phase 3 — Role-Based UI | 4–5 hrs | 🟡 High |
| Phase 4 — Modals & Forms | 5–6 hrs | 🟡 High |
| Phase 5 — Real-Time Updates | 4–5 hrs | 🟡 High |
| Phase 6 — File Uploads | 4–5 hrs | 🟡 High |
| Phase 7 — Notifications | 4–5 hrs | 🟢 Medium |
| Phase 8 — Responsive & Polish | 3–4 hrs | 🟢 Medium |
| **Total** | **33–47 hrs** | — |

---

## Implementation Order (Recommended)

```
Phase 0 (Bug Fixes)
    ↓
Phase 1 (Dashboard)  →  Phase 3 (Roles) — can start role logic while building dashboard
    ↓
Phase 2 (Sources & Annotations)  →  Phase 4 (Modals) — modals built alongside pages
    ↓
Phase 5 (Realtime)  →  Phase 7 (Notifications) — notifications after realtime is solid
    ↓
Phase 6 (File Upload) — can be done in parallel with Phase 5
    ↓
Phase 8 (Polish) — final pass
```

Phases 5 and 6 can be worked on in parallel since they're independent.
Phases 3 and 4 should be developed alongside Phases 1 and 2 respectively, not as separate sequential passes.
