# Supabase Integration Checklist

## Pre-Deployment Setup

### Supabase Project Configuration

- [ ] Create Supabase project
- [ ] Enable Authentication (Email/Password + optional OAuth)
- [ ] Enable Realtime for all tables
- [ ] Create `vault-files` storage bucket (private)
- [ ] Configure redirect URLs for auth

### Database Setup

- [ ] Run migration `001_init_schema.sql`
  - [ ] Verify tables created: vaults, vault_members, sources, annotations, files, activity_logs
  - [ ] Verify indexes created
  - [ ] Verify UUID extension enabled

- [ ] Run migration `002_enable_rls.sql`
  - [ ] Verify RLS enabled on all tables
  - [ ] Verify owner access policies
  - [ ] Verify contributor access policies
  - [ ] Verify viewer access policies

### Storage Configuration

- [ ] Configure bucket policies:
  - [ ] Users can upload files to their vault
  - [ ] Users can read files in their vaults
  - [ ] Users can delete their own files
  - [ ] File size limit set to 50MB
  - [ ] Allowed MIME types: application/pdf

### Edge Functions

- [ ] Deploy `auto-citation` function
  - [ ] Test with sample DOI: `10.1038/nature12373`
  - [ ] Verify CrossRef API integration
  - [ ] Test all citation styles (APA, MLA)

- [ ] Deploy `activity-logger` function
  - [ ] Test activity logging
  - [ ] Verify metadata storage

## Frontend Setup

### Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
CROSSREF_API_URL=https://api.crossref.org/v1
```

- [ ] Add SUPABASE_URL
- [ ] Add NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Add SUPABASE_SERVICE_ROLE_KEY
- [ ] Add SUPABASE_DB_URL
- [ ] Verify all keys are correct

### Dependencies

- [ ] Install `@supabase/supabase-js`
- [ ] Install `citation-js` (optional, for client-side citations)
- [ ] Verify no version conflicts

### API Routes

- [ ] Create `/api/auth/user` - ✅ Done
- [ ] Create `/api/vaults` - ✅ Done
- [ ] Create `/api/vaults/[id]/sources` - ✅ Done
- [ ] Create `/api/citation/generate` - ✅ Done
- [ ] Test all routes locally

### Services

- [ ] Vault service (`vault.service.ts`) - ✅ Done
- [ ] Source service (`source.service.ts`) - ✅ Done
- [ ] Annotation service (`source.annotation.service.ts`) - ✅ Done
- [ ] File service (`file.service.ts`) - ✅ Done
- [ ] Realtime service (`realtime.service.ts`) - ✅ Done

### Hooks

- [ ] Realtime hooks (`use-realtime.ts`) - ✅ Done
- [ ] Auth hook (TODO)
- [ ] Vault hook (TODO)

### Database Types

- [ ] TypeScript interfaces defined - ✅ Done
- [ ] API response types defined - ✅ Done

## Integration Testing

### Authentication Flow

- [ ] User can sign up
- [ ] User can log in
- [ ] User can log out
- [ ] User token persists across sessions
- [ ] Invalid credentials rejected

### Vault Operations

- [ ] Create vault
- [ ] List vaults
- [ ] Edit vault
- [ ] Delete vault
- [ ] Add member to vault
- [ ] Remove member from vault
- [ ] Update member role
- [ ] Prevent last owner removal

### Source Operations

- [ ] Add source to vault
- [ ] List sources with pagination
- [ ] Edit source
- [ ] Delete source
- [ ] Prevent duplicate URLs in same vault
- [ ] Auto-citation generation works

### Annotation Operations

- [ ] Add annotation to source
- [ ] List annotations with pagination
- [ ] Edit annotation (version increment)
- [ ] Delete annotation

### File Operations

- [ ] Upload PDF file
- [ ] Calculate checksum
- [ ] Generate signed URL
- [ ] Delete file (both storage & DB)
- [ ] File size validation
- [ ] File type validation

### Real-Time Collaboration

- [ ] Subscribe to vault changes
- [ ] Subscribe to source changes
- [ ] Subscribe to annotation changes
- [ ] Subscribe to member changes
- [ ] Subscribe to activity logs
- [ ] Real-time updates push to UI
- [ ] Multiple users see updates simultaneously

### Activity Logging

- [ ] Source created logged
- [ ] Source updated logged
- [ ] Source deleted logged
- [ ] Annotation created logged
- [ ] Annotation updated logged
- [ ] Annotation deleted logged
- [ ] File uploaded logged
- [ ] File deleted logged
- [ ] Member added logged
- [ ] Member removed logged
- [ ] Activity logs queryable

## Security Verification

### Row Level Security

- [ ] Owner can see their vaults
- [ ] Contributors can see vault they're in
- [ ] Viewers can see vault they're in
- [ ] Non-members cannot see vault
- [ ] Only owner can edit vault
- [ ] Only owner can delete vault
- [ ] Only owner can manage members
- [ ] Only contributors+ can add sources
- [ ] Only contributors+ can add annotations
- [ ] Only annotation creator can delete annotation

### Authentication

- [ ] JWT tokens valid
- [ ] Expired tokens rejected
- [ ] Service role key not exposed in frontend
- [ ] Anon key has limited permissions

### File Security

- [ ] Signed URLs expire
- [ ] Checksum validation works
- [ ] Only authorized users can download files
- [ ] File size limits enforced
- [ ] Malicious files rejected

## Performance Testing

### Database Performance

- [ ] Query vaults with < 100ms
- [ ] Query sources with < 200ms (paginated)
- [ ] Pagination works with 10,000+ sources
- [ ] Indexes improve query performance

### Realtime Performance

- [ ] Real-time updates < 1 second
- [ ] Multiple subscribers don't degrade performance
- [ ] Connection drops handled gracefully

### File Operations

- [ ] File uploads < 30 seconds for 50MB file
- [ ] Checksum calculation fast
- [ ] Signed URLs generated instantly

## Production Deployment

### Supabase Production Settings

- [ ] Set production environment URL
- [ ] Configure CORS properly
- [ ] Enable WAF (optional)
- [ ] Set up monitoring & logging
- [ ] Configure backup schedule
- [ ] Set up staging environment

### Frontend Deployment

- [ ] Build succeeds without errors
- [ ] All environment variables set
- [ ] No console errors in production
- [ ] API routes working
- [ ] Real-time connections work
- [ ] SSL certificate valid

### Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up performance monitoring
- [ ] Set up database monitoring
- [ ] Set up activity log monitoring
- [ ] Configure alerts for failures

### Maintenance

- [ ] Regular backups verified
- [ ] Database cleanup script created
- [ ] Old activity logs archived
- [ ] Security keys rotated regularly
- [ ] Dependencies kept up-to-date

## Documentation

- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] Deployment guide written
- [ ] Troubleshooting guide written
- [ ] Code comments added

## Optional Features

- [ ] Search functionality (full-text search)
- [ ] Email notifications
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Bulk operations
- [ ] Export functionality (CSV, PDF)
- [ ] Webhook support
- [ ] API rate limiting

---

**Setup Completed**: _______________
**Deployed By**: _______________
**Date**: _______________
