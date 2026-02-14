# SyncScript - Complete Deployment Guide

## Overview

This guide walks you through deploying SyncScript with full Supabase integration, from initial setup to production deployment.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account (free)
- Git (for version control)
- Terminal/Command line access

## Phase 1: Supabase Project Setup (5 minutes)

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up or Log in
3. Create new project
4. Fill in:
   - **Organization**: Create new or select existing
   - **Project Name**: `syncscript`
   - **Database Password**: Create strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for deployment (2-3 minutes)

### Step 1.2: Retrieve Credentials

After project creation, navigate to **Settings** → **API**:

Copy and save these values:

```
NEXT_PUBLIC_SUPABASE_URL = https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
SUPABASE_DB_URL = postgresql://postgres:PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

**⚠️ Important**: Never commit service role key or DB URL to public repository!

### Step 1.3: Configure Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **Create a new bucket**
3. Bucket name: `vault-files`
4. Toggle **Public bucket** OFF (keep private)
5. Click **Create bucket**
6. Go to bucket → **Policies**
7. Add policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to read
CREATE POLICY "Users can read" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to delete their files
CREATE POLICY "Users can delete" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## Phase 2: Database Setup (5 minutes)

### Step 2.1: Apply Migrations

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New query**
3. Copy contents of `supabase/migrations/001_init_schema.sql`
4. Paste and click **Run**
5. Wait for completion (should see green checkmark)
6. Repeat with `supabase/migrations/002_enable_rls.sql`

### Step 2.2: Verify Tables

In SQL Editor, run:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Should return:
- vaults
- vault_members
- sources
- annotations
- files
- activity_logs

## Phase 3: Edge Functions Deployment (10 minutes)

### Step 3.1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 3.2: Login to Supabase

```bash
supabase login
# Opens browser for authentication
# Press Enter when done
```

### Step 3.3: Link Project

```bash
cd supabase
supabase link --project-ref YOUR_PROJECT_ID
# When prompted, enter database password
```

### Step 3.4: Deploy Functions

```bash
supabase functions deploy auto-citation
supabase functions deploy activity-logger
```

Verify deployment:

```bash
supabase functions list
```

Should show both functions with status **Active**.

## Phase 4: Frontend Setup (10 minutes)

### Step 4.1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 4.2: Configure Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
CROSSREF_API_URL=https://api.crossref.org/v1
```

### Step 4.3: Test Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Test checklist**:
- [ ] Page loads without errors
- [ ] No red errors in console
- [ ] Supabase client initializes

## Phase 5: Integration Testing (20 minutes)

### Test 5.1: Authentication

```javascript
// In browser console
const { data } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'TestPassword123!'
});
console.log(data);
```

Expected: User created, confirmation email sent (or auto-confirmed based on settings)

### Test 5.2: Database Access

```javascript
const { data, error } = await supabase.from('vaults').select();
console.log('Vaults:', data);
console.log('Error:', error);
```

Expected: Empty array (no error)

### Test 5.3: Realtime Connection

```javascript
const channel = supabase
  .channel('test')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'vaults' },
    payload => console.log('Realtime:', payload)
  )
  .subscribe();

// In another tab, create a vault - should see update in first tab
```

Expected: Real-time updates appear instantly

### Test 5.4: File Upload

```javascript
const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
const { data, error } = await supabase.storage
  .from('vault-files')
  .upload('test-vault/test.pdf', file);
console.log('Upload:', data, error);
```

Expected: Upload succeeds without error

## Phase 6: Production Deployment

### Step 6.1: Build for Production

```bash
npm run build
```

Check for errors - fix any before deploying

### Step 6.2: Choose Hosting Platform

#### Option A: Vercel (Recommended)

```bash
npm i -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy --prod
```

#### Option B: Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect GitHub repository
4. Set environment variables in Dashboard → Settings → Build & deploy
5. Deploy

#### Option C: Self-Hosted

```bash
npm run build
npm start
```

Use PM2, Docker, or systemd to keep running

### Step 6.3: Configure Production Environment Variables

In your hosting platform settings, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

### Step 6.4: Update Supabase Auth Redirect URLs

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your production domain:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

### Step 6.5: Update CORS Settings (Optional)

If API calls fail from frontend:

1. Supabase Dashboard → **Settings** → **API**
2. Add your domain to CORS whitelist

## Phase 7: Post-Deployment Checklist

### Security

- [ ] Service role key is secret
- [ ] Database password is strong (20+ characters)
- [ ] RLS policies verified in production
- [ ] Storage bucket policies set correctly
- [ ] No console errors in browser
- [ ] HTTPS enabled on domain

### Performance

- [ ] Database queries < 200ms
- [ ] Page load < 3 seconds
- [ ] Real-time updates work
- [ ] File uploads work
- [ ] No N+1 queries

### Monitoring

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Database backups enabled (Supabase auto-backups)
- [ ] Activity logs visible in dashboard
- [ ] Alerts configured for failures

### Testing

- [ ] Create vault works
- [ ] Add source works
- [ ] Add annotation works
- [ ] Upload file works
- [ ] Real-time updates work
- [ ] Auto-citation works
- [ ] Delete operations work

## Common Issues & Solutions

### "Unauthorized" Errors

**Symptom**: `401 Unauthorized` when accessing database

**Solutions**:
1. Check RLS policies are enabled
2. Verify user is logged in: `supabase.auth.getUser()`
3. Check JWT token: `localStorage.getItem('sb-auth-token')`
4. Clear cache and reload

### Real-time Not Working

**Symptom**: Changes don't appear in real-time

**Solutions**:
1. Enable realtime: Supabase Dashboard → **Settings** → **Realtime**
2. Check WebSocket connection: Open DevTools → Network → WS
3. Verify subscription matches table: `eq('vault_id', vaultId)`

### Storage Upload Fails

**Symptom**: File upload returns error

**Solutions**:
1. Check bucket exists: `vault-files`
2. Check bucket policies in Storage → Policies
3. Check file size < 50MB
4. Check MIME type is application/pdf

### Edge Functions 404

**Symptom**: `404 Not Found` when calling Edge Function

**Solutions**:
1. Verify function deployed: `supabase functions list`
2. Check function name is correct in fetch URL
3. Check function has no syntax errors: `supabase functions list --verbose`
4. Re-deploy: `supabase functions deploy function-name`

## Scaling Considerations

### Database

- Supabase free tier: Up to 500MB
- Upgrade plan: PostgreSQL scaling automatic
- Add indexes for large tables: Already done in migrations

### Functions

- Free tier: 1 million invocations/month
- Enough for ~30k requests/day
- Upgrade if needed

### Storage

- Free tier: 1GB total storage
- Upgrade plan: Add more as needed

### Real-time

- Free tier: 2MB/day
- Automatic upgrade if exceeded

## Maintenance

### Weekly

- [ ] Check activity logs for suspicious activity
- [ ] Monitor database size
- [ ] Review error logs

### Monthly

- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`
- [ ] Review performance metrics
- [ ] Backup critical data

### Quarterly

- [ ] Rotate secrets
- [ ] Review database indexes
- [ ] Audit RLS policies
- [ ] Update documentation

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **GitHub Issues**: Report bugs

---

**Deployment Completed By**: _______________  
**Date**: _______________  
**Production URL**: _______________
