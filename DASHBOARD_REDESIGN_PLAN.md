# Dashboard Redesign — Public Vaults + Filter Tabs

## Goal
Redesign the dashboard to show **all public vaults** alongside the user's own/member vaults, with filter tabs to switch between views.

---

## Current State
- Dashboard shows **only** vaults the user owns or is a member of (via `GET /api/vaults`)
- `vaults` table has **no `is_public` column** — all vaults are implicitly private
- `Vault` TypeScript type has no `is_public` field
- `VaultCard` does not indicate public/private status
- `CreateVaultDialog` has no public/private toggle

---

## Implementation Plan

### Phase 1 — Database: Add `is_public` Column
| Item | Details |
|------|---------|
| **Migration file** | `supabase/migrations/005_add_is_public.sql` |
| **Column** | `ALTER TABLE vaults ADD COLUMN is_public BOOLEAN DEFAULT FALSE;` |
| **Manual step** | Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor → paste & run) |

### Phase 2 — Type Updates
| Item | Details |
|------|---------|
| **File** | `lib/database.types.ts` |
| **Change** | Add `is_public: boolean;` to the `Vault` interface |

### Phase 3 — API: Public Vaults Endpoint
| Item | Details |
|------|---------|
| **New route** | `GET /api/vaults/public` |
| **File** | `app/api/vaults/public/route.ts` |
| **Behavior** | Returns all vaults where `is_public = true`, ordered by `created_at` desc. No auth required (or soft-auth to mark which ones the user already belongs to). Enriches each vault with owner email/name. |

### Phase 4 — API: Update Existing Vaults Route
| Item | Details |
|------|---------|
| **File** | `app/api/vaults/route.ts` |
| **POST change** | Accept optional `is_public` boolean when creating a vault |
| **PATCH change** | Allow toggling `is_public` when updating a vault (owner only) |

### Phase 5 — Vault Service: Client Methods
| Item | Details |
|------|---------|
| **File** | `lib/services/vault.service.ts` |
| **New method** | `getPublicVaults(): Promise<ApiResponse<Vault[]>>` — calls `GET /api/vaults/public` |
| **Update** | `createVault()` accepts optional `is_public` param |

### Phase 6 — CreateVaultDialog: Public Toggle
| Item | Details |
|------|---------|
| **File** | `components/create-vault-dialog.tsx` |
| **Change** | Add a Switch/Checkbox labeled "Make this vault public" (defaults to `false`). Pass `is_public` to `vaultService.createVault()`. |

### Phase 7 — Dashboard Page: Tabbed Layout + Filters
| Item | Details |
|------|---------|
| **File** | `app/dashboard/page.tsx` |

**New UI layout:**

```
┌─────────────────────────────────────────────────────┐
│  SyncScript                      [user] [⚙] [logout]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  Dashboard                     [Find Users] [+ New]  │
│                                                      │
│  ┌──────────┬──────────┬──────────┐                  │
│  │ All      │ My Vaults│ Public   │   [Search...]    │
│  └──────────┴──────────┴──────────┘                  │
│                                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐                       │
│  │Vault │  │Vault │  │Vault │  ...                   │
│  │Card  │  │Card  │  │Card  │                        │
│  └──────┘  └──────┘  └──────┘                        │
└─────────────────────────────────────────────────────┘
```

**Filter Tabs:**
| Tab | Content |
|-----|---------|
| **All** | User's vaults + public vaults (deduplicated, default view) |
| **My Vaults** | Only vaults the user owns or is a member of |
| **Public** | Only public vaults (from `/api/vaults/public`) |

**Implementation details:**
- Use Shadcn `Tabs` component for the 3-tab layout
- Each tab switches which vault list is displayed
- Search bar filters within the active tab
- Public vaults the user is NOT a member of show a "Join" or "Request Access" button instead of "Delete"
- User's own vaults show the existing role badge + delete button

### Phase 8 — VaultCard: Public Badge + Join Button
| Item | Details |
|------|---------|
| **File** | `components/vault-card.tsx` |
| **Changes** | • Show a 🌐 "Public" badge if `vault.is_public` is true |
| | • Show owner name/email on the card (useful for public vaults) |
| | • If user is NOT a member, show "Join" button instead of delete |
| | • Accept new props: `ownerName?: string`, `isMember?: boolean`, `onJoin?: () => void` |

### Phase 9 — Settings: Vault Visibility Toggle
| Item | Details |
|------|---------|
| **Where** | Inside the vault detail page (or vault settings) |
| **Change** | Owner can toggle `is_public` on an existing vault via PATCH |

---

## File Change Summary

| File | Action |
|------|--------|
| `supabase/migrations/005_add_is_public.sql` | **CREATE** — migration SQL |
| `lib/database.types.ts` | **EDIT** — add `is_public` to `Vault` |
| `app/api/vaults/public/route.ts` | **CREATE** — public vaults endpoint |
| `app/api/vaults/route.ts` | **EDIT** — support `is_public` in POST/PATCH |
| `lib/services/vault.service.ts` | **EDIT** — add `getPublicVaults()`, update `createVault()` |
| `components/create-vault-dialog.tsx` | **EDIT** — add public toggle switch |
| `app/dashboard/page.tsx` | **EDIT** — tabbed layout with All / My / Public filters |
| `components/vault-card.tsx` | **EDIT** — public badge, owner name, join button |

---

## Prerequisites
1. **Run the migration SQL** in Supabase SQL Editor before testing:
   ```sql
   ALTER TABLE vaults ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
   CREATE INDEX IF NOT EXISTS idx_vaults_is_public ON vaults(is_public);
   ```
2. Optionally mark some existing vaults as public for testing:
   ```sql
   UPDATE vaults SET is_public = true WHERE id = '<some-vault-id>';
   ```

---

## Order of Implementation
1. Phase 1 (migration file) + Phase 2 (types) — foundational
2. Phase 3 + Phase 4 (API routes) — backend ready
3. Phase 5 (vault service) — client layer
4. Phase 6 (create dialog toggle) — quick win
5. Phase 7 (dashboard redesign) — main deliverable
6. Phase 8 (vault card updates) — visual polish
7. Phase 9 (settings toggle) — nice-to-have
