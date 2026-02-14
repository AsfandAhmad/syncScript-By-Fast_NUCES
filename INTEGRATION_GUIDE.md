# SyncScript - Backend & Supabase Integration Setup

## Overview

SyncScript is a collaborative research and citation engine built with Next.js frontend and Supabase backend. This document guides you through the complete setup process.

## Directory Structure

```
project-root/
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── vaults/
│   │   │   └── citation/
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── vault/
│   ├── lib/
│   │   ├── supabase-client.ts      # Client-side Supabase
│   │   ├── supabase-server.ts      # Server-side Supabase
│   │   ├── database.types.ts       # TypeScript types
│   │   └── services/
│   │       ├── vault.service.ts
│   │       ├── source.service.ts
│   │       ├── source.annotation.service.ts
│   │       ├── file.service.ts
│   │       └── realtime.service.ts
│   └── hooks/
│       └── use-realtime.ts         # Real-time collaboration hooks
├── supabase/
│   ├── config.json
│   ├── .env.example
│   ├── migrations/
│   │   ├── 001_init_schema.sql     # Database tables & indexes
│   │   └── 002_enable_rls.sql      # Row Level Security policies
│   └── functions/
│       ├── auto-citation/          # Citation generation
│       └── activity-logger/        # Activity logging
└── backend/
    └── (Optional serverless functions)
```

## Step 1: Supabase Project Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Save your credentials:
   - **Project URL**: `https://YOUR_PROJECT_ID.supabase.co`
   - **Anon Key**: Used in frontend (public)
   - **Service Role Key**: Used in backend (keep secret)
   - **JWT Secret**: For token verification

### 1.2 Configure Environment Variables

Create `.env.local` in the `frontend/` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
CROSSREF_API_URL=https://api.crossref.org/v1
```

### 1.3 Enable Required Supabase Features

In the Supabase dashboard:

1. **Authentication**
   - Enable Email/Password auth
   - Enable OAuth providers (Google, GitHub, etc.) - optional
   - Set redirect URLs to `http://localhost:3000/auth/callback` (dev) and your production URL

2. **Realtime**
   - Enable realtime for all tables
   - Supabase dashboard → Project Settings → Realtime

3. **Storage**
   - Create a new bucket named `vault-files`
   - Make it **private** for security
   - Set policies to allow authenticated users

## Step 2: Database Setup

### 2.1 Apply Migrations

Run the SQL migrations in order in the Supabase SQL editor:

1. Open Supabase dashboard → SQL Editor
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/001_init_schema.sql`
4. Execute
5. Repeat for `002_enable_rls.sql`

### 2.2 Verify Tables

Check that all tables were created:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Expected tables:
- `vaults`
- `vault_members`
- `sources`
- `annotations`
- `files`
- `activity_logs`

### 2.3 Configure Storage Bucket

```sql
-- Set up storage bucket policies
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('vault-files', 'vault-files', false, false, 52428800, ARRAY['application/pdf']);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload to their vault" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to read files in their vaults
CREATE POLICY "Users can read vault files" ON storage.objects
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their files" ON storage.objects
  FOR DELETE USING (
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Step 3: Deploy Edge Functions

### 3.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 3.2 Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### 3.3 Deploy Functions

```bash
supabase functions deploy auto-citation
supabase functions deploy activity-logger
```

### 3.4 Verify Deployment

```bash
supabase functions list
```

## Step 4: Frontend Setup

### 4.1 Install Dependencies

```bash
cd frontend
npm install @supabase/supabase-js
npm install citation-js  # For citation formatting
```

### 4.2 Update Environment Variables

Update `frontend/.env.local` with your Supabase credentials.

### 4.3 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Testing the Integration

### 5.1 Test Authentication

```javascript
// In browser console
const { data } = await supabase.auth.getUser();
console.log(data);
```

### 5.2 Test Database Access

```javascript
// In browser console
const { data } = await supabase.from('vaults').select();
console.log(data);
```

### 5.3 Test Realtime

```javascript
// In browser console
const channel = supabase.channel('test')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'vaults' }, (payload) => {
    console.log('Realtime update:', payload);
  })
  .subscribe();
```

## Step 6: API Endpoints

### Authentication

- `GET /api/auth/user` - Get current user

### Vaults

- `GET /api/vaults` - List all vaults
- `POST /api/vaults` - Create a new vault
- `GET /api/vaults/[id]/sources` - List sources in vault
- `POST /api/vaults/[id]/sources` - Create a source

### Citations

- `POST /api/citation/generate` - Generate citation from URL

## Edge Cases Handled

| Edge Case | Solution |
|-----------|----------|
| Duplicate sources | DB unique constraint `(vault_id, url)` |
| Concurrent edits | Optimistic locking with `version` field |
| Last owner leaving | RLS policy prevents removal |
| Contributor removed | Realtime updates revoke access |
| Large vaults (10k+) | Cursor-based pagination + DB indexes |
| File tampering | SHA-256 checksum verification |
| Offline edits | Signed URLs + checksum verification |
| API abuse | Rate limiting via Supabase Edge Functions |

## Security Best Practices

✅ **Implemented:**

- Row Level Security (RLS) at DB level
- JWT-based authentication
- Service role key never exposed to frontend
- Signed URLs for file access
- Checksum verification for file integrity
- Role-based access control (Owner/Contributor/Viewer)

⚠️ **Recommended:**

- Enable Supabase WAF (Web Application Firewall)
- Set up rate limiting on Edge Functions
- Use HTTPS in production
- Rotate secrets regularly
- Monitor activity logs for suspicious activity

## Troubleshooting

### "Unauthorized" Errors

1. Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
2. Ensure user is authenticated via `supabase.auth.signIn()`
3. Verify RLS policies in database

### Realtime Not Working

1. Enable realtime in Supabase dashboard
2. Check browser console for WebSocket errors
3. Verify table name matches in subscription

### Storage Bucket Errors

1. Verify bucket name is `vault-files`
2. Check storage policies allow authenticated users
3. Ensure file size < 50MB

### Edge Function Errors

1. Check function logs: `supabase functions list` → see logs
2. Verify environment variables in `.env.local`
3. Test with curl: `curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/auto-citation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"url":"https://doi.org/10.1038/nature12373"}'`

## Performance Optimization

### Database Indexes

Already created in migration:
- `idx_vaults_owner_id`
- `idx_vaults_created_at`
- `idx_sources_vault_id`
- `idx_activity_logs_vault_id`
- `idx_files_vault_id`

### Query Optimization

Use pagination for large datasets:

```javascript
// Good: Paginated query
const { data } = await supabase
  .from('sources')
  .select()
  .eq('vault_id', vaultId)
  .range(0, 19);  // First 20 records

// Avoid: Fetching all records
const { data } = await supabase
  .from('sources')
  .select()
  .eq('vault_id', vaultId);  // Could be 10k+ records
```

### Caching

Consider adding ISR (Incremental Static Regeneration) for frequently accessed data:

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

## Monitoring & Maintenance

### Activity Logs

Query activity logs for audit trails:

```javascript
const { data } = await supabase
  .from('activity_logs')
  .select()
  .eq('vault_id', vaultId)
  .order('timestamp', { ascending: false })
  .limit(100);
```

### User Analytics

Track user engagement via activity logs:

```sql
SELECT
  actor_id,
  action_type,
  COUNT(*) as count,
  MAX(timestamp) as last_action
FROM activity_logs
GROUP BY actor_id, action_type
ORDER BY last_action DESC;
```

## Next Steps

1. **Authentication UI**: Implement login/signup pages with Supabase Auth
2. **Dashboard**: Build vault management interface
3. **Collaborative Editing**: Add real-time cursor positions and conflict resolution
4. **Notifications**: Implement email/in-app notifications via Edge Functions
5. **Advanced Search**: Add full-text search on sources and annotations
6. **Analytics**: Track usage metrics and generate reports

## Support

For issues with:
- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Citation**: [citation.js](https://citation.js.org)

---

**Last Updated**: February 14, 2026
