# Frontend Implementation Plan - SyncScript

## 📊 Current State Analysis

### ✅ Already Implemented
- ✅ Dashboard page with vault listing
- ✅ Vault detail page with tabs (Sources, Files, Members, Activity)
- ✅ Realtime hooks (`useRealtimeSources`, `useRealtimeMembers`, `useRealtimeActivity`)
- ✅ File uploader component with drag-and-drop
- ✅ Service layer (vault, source, file, realtime services)
- ✅ UI components (SourceItem, FileListPanel, MemberManagement, ActivityFeed)
- ✅ API routes structure
- ✅ Authentication flow
- ✅ Database types and schemas

### ⚠️ Needs Implementation/Enhancement
- ⚠️ Dynamic role-based UI (hiding/showing actions per role)
- ⚠️ Complete modals/forms (annotations, source details)
- ⚠️ In-app notification system
- ⚠️ File upload integration with Supabase Storage
- ⚠️ Real-time file updates
- ⚠️ Annotations management UI
- ⚠️ Error boundaries and loading states
- ⚠️ Mobile responsiveness refinement

---

## 🎯 Implementation Phases

---

## **PHASE 1: Foundation & Role-Based Access Control** (3-4 days)

### **Goal:** Implement complete role-based UI rendering and permissions

### **Tasks:**

#### 1.1 Create Role-Based Permission Hook
**File:** `frontend/hooks/use-permissions.ts`
```typescript
export function usePermissions(role?: Role) {
  return {
    canCreateSource: role === 'owner' || role === 'contributor',
    canEditSource: role === 'owner' || role === 'contributor',
    canDeleteSource: role === 'owner', // or creator
    canAddAnnotation: role === 'owner' || role === 'contributor',
    canEditAnnotation: role === 'owner' || role === 'contributor',
    canDeleteAnnotation: true, // own annotations only
    canUploadFile: role === 'owner' || role === 'contributor',
    canDeleteFile: role === 'owner', // or uploader
    canManageMembers: role === 'owner',
    canArchiveVault: role === 'owner',
    canDeleteVault: role === 'owner',
    isOwner: role === 'owner',
    isContributor: role === 'contributor',
    isViewer: role === 'viewer',
  };
}
```

#### 1.2 Add Permission Context
**File:** `frontend/contexts/permission-context.tsx`
- Create context to share current user's role across components
- Avoid prop drilling
- Provide `usePermissionContext()` hook

#### 1.3 Update Vault Detail Page
**File:** `frontend/app/vault/[id]/page.tsx`
- Integrate `usePermissions` hook
- Conditionally render "Add Source" button
- Conditionally render "Upload File" button
- Show role badge for current user
- Hide/disable actions based on permissions

#### 1.4 Update Components with Role Logic
**Files to update:**
- `components/source-item.tsx` - Show/hide edit/delete buttons
- `components/file-list-panel.tsx` - Show/hide delete buttons
- `components/member-management.tsx` - Only allow owners to add/remove
- `components/annotation-editor.tsx` - Disable editing for viewers
- `components/vault-card.tsx` - Show role badge

#### 1.5 Add Visual Role Indicators
**Create:** `components/role-indicator.tsx`
- Display user's current role with color-coded badge
- Show tooltip explaining permissions

### **Deliverables:**
- ✅ Permission hook implemented
- ✅ All UI components respect user role
- ✅ Owners see full controls
- ✅ Contributors can add/edit content but not manage members
- ✅ Viewers see read-only interface
- ✅ Visual indicators for roles

### **Testing Checklist:**
- [ ] Login as each demo user (different roles)
- [ ] Verify correct buttons show/hide
- [ ] Test permission boundaries (contributors can't delete vaults)
- [ ] Verify RLS policies block unauthorized API calls

---

## **PHASE 2: Complete Forms & Modals** (3-4 days)

### **Goal:** Build comprehensive forms for all CRUD operations

### **Tasks:**

#### 2.1 Enhance Source Management
**File:** `components/add-source-dialog.tsx` (create)
- Form fields: URL (required), Title (optional)
- URL validation (must be valid URL)
- Auto-fetch metadata option (title from URL)
- Loading states
- Error handling
- Success feedback

**File:** `components/edit-source-dialog.tsx` (create)
- Pre-fill with existing source data
- Update URL, title, metadata
- Version tracking UI

**File:** `components/delete-source-confirm.tsx` (create)
- Confirmation dialog with warning
- Show impact (annotations will be deleted)
- Require explicit confirmation

#### 2.2 Annotation Management UI
**File:** `components/annotation-panel.tsx` (create)
- List all annotations for a source
- Inline editing for own annotations
- Rich text editor (simple textarea or markdown)
- Show author and timestamp
- Delete confirmation for own annotations

**File:** `components/add-annotation-dialog.tsx` (create)
- Textarea with character counter
- Auto-save draft to localStorage
- Preview mode
- Quick templates (optional)

#### 2.3 Vault Management Forms
**File:** `components/edit-vault-dialog.tsx` (create)
- Update vault name and description
- Archive/unarchive toggle (owners only)
- Preview changes

**File:** `components/vault-settings-dialog.tsx` (create)
- Danger zone: Delete vault (with confirmation)
- Show vault statistics (sources, files, members)
- Export data option (future)

#### 2.4 Member Management Enhancement
**Update:** `components/member-management.tsx`
- Search users by email to add
- Async email validation
- Role selection dropdown
- Bulk actions (remove multiple members)
- Change role modal
- Show pending invitations (future)

#### 2.5 Form Validation & UX
**Create:** `lib/form-validators.ts`
- URL validation utility
- Email validation
- Required field checks
- Max length checks
- Custom error messages

**Install:** `react-hook-form` + `zod` (if not already)
```bash
npm install react-hook-form zod @hookform/resolvers
```

### **Deliverables:**
- ✅ All CRUD operations have polished forms
- ✅ Form validation with clear error messages
- ✅ Loading states during submission
- ✅ Success/error toast notifications
- ✅ Keyboard shortcuts (Esc to close, Enter to submit)
- ✅ Accessible (ARIA labels, focus management)

### **Testing Checklist:**
- [ ] All form fields validate correctly
- [ ] Error messages are user-friendly
- [ ] Can't submit invalid data
- [ ] Success feedback is immediate
- [ ] Forms close on successful submission
- [ ] Keyboard navigation works

---

## **PHASE 3: Enhanced Real-Time Updates** (2-3 days)

### **Goal:** Ensure all data updates immediately across all connected clients

### **Tasks:**

#### 3.1 Real-Time File Updates
**File:** `hooks/use-realtime.ts` (extend)
- Add `useRealtimeFiles(vaultId)` hook
- Subscribe to file insert/delete events
- Update file list in real-time

**Update:** `components/file-list-panel.tsx`
- Integrate real-time files hook
- Show upload progress for all users
- Animate new file entries

#### 3.2 Real-Time Vault List (Dashboard)
**File:** `hooks/use-realtime.ts` (extend)
- Add `useRealtimeVaults()` hook for dashboard
- Subscribe to vault create/update/delete
- Update dashboard without refresh

**Update:** `app/dashboard/page.tsx`
- Replace static vault state with real-time hook
- Animate vault card additions/removals

#### 3.3 Optimistic Updates
**Pattern to implement:**
```typescript
// In form submit handlers:
1. Immediately update local state (optimistic)
2. Send API request
3. Revert on error, or confirm on success
4. Real-time sync ensures eventual consistency
```

**Apply to:**
- Adding sources (show immediately)
- Adding annotations (show immediately)
- Uploading files (show progress, then confirm)

#### 3.4 Real-Time Connection Status
**Create:** `components/connection-status.tsx`
- Show indicator when real-time is connected/disconnected
- Auto-reconnect on network restore
- Subtle banner: "Connected" / "Reconnecting..."

**Create:** `hooks/use-connection-status.ts`
- Monitor Supabase Realtime connection state
- Provide boolean flag: `isConnected`

#### 3.5 Conflict Resolution
**Strategy:** Last-write-wins (Supabase default)
- Document in README for users
- Show warning when editing something another user is editing (future: Yjs integration)

### **Deliverables:**
- ✅ Files appear instantly when uploaded by any user
- ✅ Sources/annotations appear immediately
- ✅ Members see updates without refreshing
- ✅ Connection status indicator in header
- ✅ Optimistic updates for better UX
- ✅ No stale data issues

### **Testing Checklist:**
- [ ] Open vault in 2 browser tabs (different users)
- [ ] Add source in tab 1, see it in tab 2 instantly
- [ ] Upload file in tab 1, see it in tab 2
- [ ] Delete member in tab 1, they get removed in tab 2
- [ ] Connection indicator shows correct status

---

## **PHASE 4: File Upload Integration** (2-3 days)

### **Goal:** Complete file upload flow with Supabase Storage

### **Tasks:**

#### 4.1 Supabase Storage Setup
**File:** `supabase/migrations/003_storage_setup.sql` (create)
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault-files', 'vault-files', false);

-- RLS policies for storage
CREATE POLICY "Users can upload to vaults they have access to"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vault-files' AND
  -- Check user has access to vault
  ...
);

CREATE POLICY "Users can download from vaults they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vault-files' AND
  -- Check user has access to vault
  ...
);
```

#### 4.2 Update File Service
**File:** `lib/services/file.service.ts`
- Implement `uploadFile()` with Supabase Storage
- Generate signed upload URL
- Upload file to storage
- Save file record to `files` table
- Return file URL

**Flow:**
```typescript
1. Get signed upload URL from Supabase
2. Upload file to storage
3. Calculate checksum
4. Create file record in database
5. Log activity
6. Return success
```

#### 4.3 File Download/Preview
**Create:** `components/file-preview-dialog.tsx`
- For images: Show preview
- For PDFs: Embed viewer
- For others: Download link
- Show file metadata (size, uploaded by, date)

**Update:** `components/file-list-panel.tsx`
- Click file to preview/download
- Show file icons by type
- Show file size in human-readable format

#### 4.4 Upload Progress Indicator
**Update:** `components/file-uploader.tsx`
- Show upload progress bar (0-100%)
- Use Supabase storage progress events
- Estimate time remaining
- Allow cancel upload

#### 4.5 File Validation
**Add validation:**
- Max file size (50MB default, configurable)
- Allowed file types (PDF, images, docs)
- Virus scanning integration (optional, can use Cloudflare Stream)
- Duplicate detection via checksum

### **Deliverables:**
- ✅ Files upload to Supabase Storage successfully
- ✅ File URLs are secured (signed URLs)
- ✅ Upload progress shows accurately
- ✅ Files can be previewed (images/PDFs)
- ✅ Files can be downloaded
- ✅ File uploads trigger real-time updates
- ✅ Checksums prevent duplicate uploads

### **Testing Checklist:**
- [ ] Upload various file types (PDF, PNG, DOCX)
- [ ] Large file upload shows progress
- [ ] Can download uploaded files
- [ ] Image preview works
- [ ] PDF preview works
- [ ] Only authorized users can access files
- [ ] Duplicate files detected via checksum

---

## **PHASE 5: Notification System** (3-4 days)

### **Goal:** In-app notifications for important events

### **Tasks:**

#### 5.1 Notification Data Model
**File:** `lib/database.types.ts` (extend)
```typescript
export interface Notification {
  id: string;
  user_id: string;
  vault_id?: string;
  type: 'member_added' | 'source_added' | 'annotation_added' | 'file_uploaded';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata: Record<string, any>;
}
```

**Migration:** `supabase/migrations/004_notifications.sql`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

#### 5.2 Notification Service
**File:** `lib/services/notification.service.ts` (create)
- `createNotification(userId, type, title, message, metadata)`
- `getUnreadNotifications(userId)`
- `markAsRead(notificationId)`
- `markAllAsRead(userId)`
- `deleteNotification(notificationId)`

#### 5.3 Notification Component
**Create:** `components/notification-center.tsx`
- Bell icon in header with unread count badge
- Dropdown panel showing recent notifications
- Mark individual as read
- "Mark all as read" button
- Click notification to navigate to relevant vault/source
- Categorize by type (member, source, file, annotation)

**Create:** `components/notification-item.tsx`
- Display title, message, timestamp
- Show vault name
- Icon per notification type
- Unread indicator (dot/bold)

#### 5.4 Real-Time Notifications
**File:** `hooks/use-realtime.ts` (extend)
- Add `useRealtimeNotifications(userId)` hook
- Subscribe to new notifications for user
- Update notification list in real-time
- Play sound/show browser notification (optional)

#### 5.5 Notification Triggers
**Update API routes to create notifications:**

**File:** `app/api/vaults/[id]/members/route.ts`
```typescript
// When adding a member:
await notificationService.createNotification(
  newMemberUserId,
  'member_added',
  'Added to vault',
  `You've been added as ${role} to ${vaultName}`,
  { vault_id, role }
);
```

**File:** `app/api/sources/route.ts`
```typescript
// When adding a source:
// Notify all vault members except creator
await notificationService.notifyVaultMembers(
  vaultId,
  excludeUserId,
  'source_added',
  'New source added',
  `${userName} added ${sourceTitle}`
);
```

**File:** `app/api/files/route.ts`
```typescript
// When uploading a file:
await notificationService.notifyVaultMembers(
  vaultId,
  excludeUserId,
  'file_uploaded',
  'New file uploaded',
  `${userName} uploaded ${fileName}`
);
```

#### 5.6 Browser Notifications (Optional Enhancement)
**Integrate Web Notification API:**
- Request permission on login
- Show browser notification for new notifications
- Click to open app

### **Deliverables:**
- ✅ Notification center in header
- ✅ Real-time notification updates
- ✅ Unread count badge
- ✅ Notifications created for:
  - Member added to vault
  - New source added
  - New file uploaded
  - New annotation (on user's source)
- ✅ Click notification to navigate
- ✅ Mark as read functionality

### **Testing Checklist:**
- [ ] Add user to vault → they get notification
- [ ] Add source → vault members get notified
- [ ] Upload file → members get notified
- [ ] Notification appears instantly (real-time)
- [ ] Unread count updates correctly
- [ ] Can mark notifications as read
- [ ] Clicking notification navigates correctly

---

## **PHASE 6: Polish & Responsive Design** (2-3 days)

### **Goal:** Ensure app is fully responsive and polished

### **Tasks:**

#### 6.1 Mobile Responsiveness
**Update all pages and components:**
- Dashboard: Stack cards on mobile
- Vault detail: Collapse sidebar tabs to accordion
- Forms: Full-width on mobile
- Tables: Horizontal scroll or card layout
- Navigation: Hamburger menu

**Test on:**
- Mobile (375px - iPhone SE)
- Tablet (768px - iPad)
- Desktop (1024px+)

#### 6.2 Loading States
**Ensure all async operations show loading:**
- Skeleton loaders for lists
- Spinner for buttons during submit
- Shimmer effect for images loading
- Progress bars for file uploads

**Create:** `components/skeletons/` directory
- `vault-card-skeleton.tsx` ✅ (exists)
- `source-list-skeleton.tsx`
- `file-list-skeleton.tsx`
- `annotation-skeleton.tsx`

#### 6.3 Empty States
**Create meaningful empty states:**
- No vaults created yet → "Create your first vault"
- No sources in vault → "Add your first source"
- No files uploaded → "Upload files here"
- No members → "Invite team members"

**Create:** `components/empty-state.tsx`
- Icon, title, description, action button
- Reusable component

#### 6.4 Error Handling
**Add error boundaries:**
**Create:** `components/error-boundary.tsx`
- Catch React errors gracefully
- Show user-friendly error message
- "Try again" button
- Log errors to console (or Sentry)

**API Error Handling:**
- Show toast for API errors
- Specific messages for 401, 403, 404, 500
- Retry logic for network errors

#### 6.5 Accessibility (A11y)
**Ensure:**
- All buttons have aria-labels
- Forms have proper labels
- Keyboard navigation works everywhere
- Focus indicators visible
- Color contrast meets WCAG AA
- Screen reader friendly

**Test with:**
- Tab key navigation
- Screen reader (NVDA/VoiceOver)
- Lighthouse accessibility audit

#### 6.6 Performance Optimization
**Implement:**
- Lazy loading for components (React.lazy)
- Image optimization (next/image)
- Debounced search inputs
- Pagination for long lists
- Memoization (React.memo, useMemo, useCallback)

#### 6.7 Dark Mode Enhancement
**Verify dark mode works:**
- All colors have dark variants
- Images/icons adapt to theme
- No white flash on load

### **Deliverables:**
- ✅ App works perfectly on mobile, tablet, desktop
- ✅ All loading states are smooth
- ✅ Empty states guide users
- ✅ Errors are handled gracefully
- ✅ Keyboard navigation works everywhere
- ✅ Performance is optimized
- ✅ Lighthouse score >90

### **Testing Checklist:**
- [ ] Test on real mobile device
- [ ] Test with slow 3G network
- [ ] Navigate entire app with keyboard only
- [ ] Run Lighthouse audit
- [ ] Test dark mode throughout
- [ ] Verify all animations are smooth

---

## **PHASE 7: Integration & End-to-End Testing** (2-3 days)

### **Goal:** Ensure all features work together seamlessly

### **Tasks:**

#### 7.1 User Journey Testing
**Test complete workflows:**

**Journey 1: New User Onboarding**
1. Sign up
2. Create first vault
3. Add a source
4. Add an annotation
5. Upload a file
6. Invite a member

**Journey 2: Collaborator Workflow**
1. Receive invitation notification
2. View vault as contributor
3. Add source (allowed)
4. Try to delete vault (denied)
5. Add annotation
6. Upload file

**Journey 3: Viewer Workflow**
1. View vault as viewer
2. Verify can't add sources (buttons hidden)
3. Can view sources and annotations
4. Can download files (but not delete)

#### 7.2 Real-Time Sync Testing
**Multi-User Testing:**
- Open 3 browser windows (Alice, Bob, Charlie)
- Alice creates vault, adds Bob as contributor, Charlie as viewer
- Bob adds source → Alice and Charlie see it instantly
- Alice adds annotation → Bob and Charlie see it
- Charlie tries to add source → UI prevents it

#### 7.3 Edge Case Testing
**Test scenarios:**
- Slow network (throttle to 3G)
- Offline mode (show "No connection" banner)
- Large file uploads (50MB)
- Very long vault names/descriptions
- Special characters in URLs
- Empty vaults
- Deleted user (show "Deleted User")
- Removed from vault while viewing (redirect to dashboard)

#### 7.4 Security Testing
**Verify RLS policies:**
- Can't access vaults you're not a member of
- Can't delete someone else's annotations
- Can't download files from private vaults
- Can't bypass role restrictions via API

**Test:**
- Direct API calls (Postman)
- Modified client-side code
- SQL injection attempts (should be blocked by Supabase)

#### 7.5 Performance Testing
**Load Testing:**
- Create vault with 1000+ sources
- Upload 100+ files
- 50+ vault members
- Test pagination and virtualized lists

**Metrics to track:**
- Page load time <3s
- Time to interactive <5s
- Real-time update latency <500ms
- File upload speed (depends on network)

#### 7.6 Cross-Browser Testing
**Test on:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

#### 7.7 Documentation
**Create/Update:**
- User guide (how to use the app)
- Developer README
- API documentation
- Deployment guide
- Troubleshooting guide

### **Deliverables:**
- ✅ All user journeys tested and working
- ✅ Multi-user real-time sync confirmed
- ✅ Edge cases handled
- ✅ Security verified
- ✅ Performance benchmarks met
- ✅ Cross-browser compatibility
- ✅ Documentation complete

### **Testing Checklist:**
- [ ] Complete all 3 user journeys without errors
- [ ] Multi-user test with 3 simultaneous users
- [ ] All edge cases tested
- [ ] RLS policies verified via API tests
- [ ] Performance metrics meet targets
- [ ] Works on all major browsers
- [ ] Documentation reviewed

---

## **PHASE 8: Final Polish & Deployment Prep** (1-2 days)

### **Goal:** Production-ready application

### **Tasks:**

#### 8.1 Code Review & Cleanup
- Remove console.logs (except errors)
- Remove commented code
- Ensure consistent code formatting
- Add JSDoc comments to complex functions
- Verify no unused imports/variables

#### 8.2 Environment Configuration
**Files to configure:**
- `.env.example` - Document all env vars
- `.env.local` - Development
- `.env.production` - Production (Vercel/other host)

**Required env vars:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

#### 8.3 Security Hardening
- Verify all API routes use authentication
- Check for exposed secrets
- Enable CORS restrictions
- Set security headers (CSP, etc.)
- Rate limiting on API routes (optional)

#### 8.4 SEO & Meta Tags
**Update:** `app/layout.tsx`
- Add proper meta tags
- Open Graph tags
- Twitter Card tags
- Favicon

#### 8.5 Analytics (Optional)
**Integrate:** Vercel Analytics or Google Analytics
- Track page views
- Track user events (vault created, file uploaded)
- Monitor errors

#### 8.6 Deployment
**Platform:** Vercel (recommended for Next.js)

**Steps:**
1. Push code to GitHub
2. Connect Vercel to repo
3. Set environment variables in Vercel
4. Deploy
5. Test production build
6. Set up custom domain (optional)

#### 8.7 Post-Deployment Monitoring
**Set up:**
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot)
- Performance monitoring (Vercel Analytics)

#### 8.8 Backup & Recovery Plan
- Document database backup process
- Document rollback procedure
- Test restore from backup

### **Deliverables:**
- ✅ Clean, production-ready code
- ✅ All environment variables documented
- ✅ Security hardened
- ✅ Deployed to production
- ✅ Monitoring in place
- ✅ Backup plan documented

### **Testing Checklist:**
- [ ] Production build runs without errors
- [ ] All features work in production
- [ ] Environment variables correct
- [ ] Analytics tracking events
- [ ] Error monitoring working
- [ ] Can restore from backup

---

## 📅 Timeline Summary

| Phase | Duration | Key Focus |
|-------|----------|-----------|
| Phase 1: Role-Based Access | 3-4 days | Permissions, role UI |
| Phase 2: Forms & Modals | 3-4 days | Complete CRUD forms |
| Phase 3: Real-Time Enhanced | 2-3 days | File sync, optimistic updates |
| Phase 4: File Upload | 2-3 days | Storage integration |
| Phase 5: Notifications | 3-4 days | In-app notification system |
| Phase 6: Polish & Responsive | 2-3 days | Mobile, accessibility |
| Phase 7: Integration Testing | 2-3 days | E2E tests, security |
| Phase 8: Deployment Prep | 1-2 days | Production ready |
| **TOTAL** | **18-26 days** | **~4-5 weeks** |

---

## 🎯 Success Criteria

### **Must-Have (MVP)**
- ✅ Role-based UI fully working
- ✅ All CRUD operations with forms
- ✅ Real-time updates for sources, annotations, files
- ✅ File upload to Supabase Storage
- ✅ In-app notifications
- ✅ Mobile responsive
- ✅ Secure (RLS enforced)

### **Should-Have**
- ✅ Optimistic updates
- ✅ Connection status indicator
- ✅ Empty states and loading states
- ✅ Error boundaries
- ✅ Keyboard navigation
- ✅ Dark mode

### **Nice-to-Have (Future)**
- Browser push notifications
- Collaborative editing (Yjs)
- Advanced search/filtering
- Export vault data
- Email notifications
- Audit log viewer
- Admin dashboard

---

## 🔧 Technical Stack Summary

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- Shadcn UI components
- React Hook Form + Zod
- Supabase JS Client
- Sonner (toast notifications)

**Backend:**
- Supabase (PostgreSQL + Realtime + Storage)
- Row Level Security (RLS)
- Edge Functions (optional)

**Development:**
- ESLint + Prettier
- Vercel (deployment)
- Git (version control)

---

## 📝 Notes & Recommendations

### **Best Practices:**
1. **Commit Often** - Commit after each completed task
2. **Test as You Build** - Don't wait until Phase 7 to test
3. **Mobile First** - Design for mobile, enhance for desktop
4. **Accessibility First** - Build accessible from start, not as afterthought
5. **Incremental Deployment** - Deploy after each phase to staging

### **Common Pitfalls to Avoid:**
- ❌ Not handling loading states → User sees blank screen
- ❌ Not handling errors → App crashes on API failure
- ❌ Forgetting mobile → Desktop-only app
- ❌ Hardcoding user IDs → Use auth context
- ❌ Not testing real-time → Stale data issues
- ❌ Skipping accessibility → Excludes users

### **Performance Tips:**
- Use `React.memo` for heavy components
- Debounce search inputs (300ms)
- Paginate long lists (20-50 items per page)
- Lazy load images with `next/image`
- Use Supabase's `.limit()` and `.range()` for queries

### **Security Reminders:**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- Always validate on server (API routes)
- Trust RLS policies, not client-side checks
- Sanitize user input (especially URLs)
- Use signed URLs for file downloads

---

## 🚀 Getting Started

### **Phase 1 First Task:**
```bash
# 1. Create permission hook
touch frontend/hooks/use-permissions.ts

# 2. Create permission context
mkdir frontend/contexts
touch frontend/contexts/permission-context.tsx

# 3. Install dependencies if needed
npm install react-hook-form zod @hookform/resolvers

# 4. Start dev server
npm run dev

# 5. Open vault detail page and start integrating permissions
code frontend/app/vault/[id]/page.tsx
```

---

## ✅ Pre-Implementation Checklist

Before starting Phase 1:
- [ ] Database is seeded with test data
- [ ] All 5 demo users can log in
- [ ] Environment variables are set
- [ ] Dev server runs without errors
- [ ] Familiarized with existing codebase
- [ ] Supabase RLS policies are applied
- [ ] This plan is reviewed and understood

---

**Ready to implement? Start with Phase 1! 🎉**
