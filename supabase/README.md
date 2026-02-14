# Backend Setup Guide

## Supabase Backend for SyncScript

This folder contains all backend infrastructure for SyncScript, including:

- **Migrations**: PostgreSQL schema and RLS policies
- **Functions**: Serverless Edge Functions for auto-citation and activity logging
- **Configuration**: Environment setup and deployment configs

## Quick Start

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Create Project

Create a new Supabase project at [supabase.com](https://supabase.com)

### 3. Link Project

```bash
cd supabase
supabase link --project-ref YOUR_PROJECT_ID
```

### 4. Apply Migrations

Migrations are applied automatically, but you can manually run:

```bash
supabase db push
```

### 5. Deploy Functions

```bash
supabase functions deploy auto-citation
supabase functions deploy activity-logger
```

## File Structure

```
supabase/
├── config.json                 # Project configuration
├── supabase.json              # Supabase CLI config
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── migrations/
│   ├── 001_init_schema.sql    # Create tables & indexes
│   └── 002_enable_rls.sql     # Enable Row Level Security
└── functions/
    ├── auto-citation/
    │   └── index.ts           # Citation generation function
    └── activity-logger/
        └── index.ts           # Activity logging function
```

## Database Schema

### Tables

1. **vaults** - Research project containers
   - id, name, description, owner_id, is_archived, created_at, updated_at
   
2. **vault_members** - Access control
   - id, vault_id, user_id, role (owner/contributor/viewer), joined_at
   
3. **sources** - Research sources/citations
   - id, vault_id, url, title, metadata (JSONB), version, created_by, created_at, updated_at
   - Unique constraint: (vault_id, url)
   
4. **annotations** - Source notes and highlights
   - id, source_id, content, version, created_by, created_at, updated_at
   
5. **files** - Uploaded PDFs and documents
   - id, vault_id, file_url, file_name, file_size, checksum, uploaded_by, created_at
   
6. **activity_logs** - Audit trail
   - id, vault_id, action_type, actor_id, metadata (JSONB), timestamp

### Indexes

Created for performance:
- `idx_vaults_owner_id` - Fast owner lookups
- `idx_vaults_created_at` - Timeline queries
- `idx_sources_vault_id` - List sources by vault
- `idx_annotations_source_id` - List annotations by source
- `idx_files_vault_id` - List files by vault
- `idx_activity_logs_vault_id` - List activity by vault
- `idx_activity_logs_timestamp` - Timeline queries
- `idx_activity_logs_action_type` - Filter by action

### Row Level Security (RLS)

Policies enforce:

- **Owners**: Full access to vault + member management
- **Contributors**: Can add/edit sources & annotations
- **Viewers**: Read-only access
- **Non-members**: No access

## Edge Functions

### auto-citation

**Endpoint**: `POST /functions/v1/auto-citation`

**Purpose**: Fetch metadata from CrossRef API and generate citations

**Request**:
```json
{
  "url": "https://doi.org/10.1038/nature12373",
  "style": "apa"  // or "mla", "chicago"
}
```

**Response**:
```json
{
  "metadata": {
    "doi": "10.1038/nature12373",
    "title": "Citation title",
    "authors": [{"given": "John", "family": "Doe"}],
    "published": [2013, 5, 22],
    "journal": "Nature",
    "volume": "497",
    "pages": "123-126"
  },
  "citation": "APA formatted citation...",
  "style": "apa"
}
```

**Features**:
- Extracts DOI from URL
- Fetches metadata from CrossRef API
- Generates multiple citation formats
- Handles missing metadata gracefully

### activity-logger

**Endpoint**: `POST /functions/v1/activity-logger`

**Purpose**: Log vault activities for audit trail

**Request**:
```json
{
  "vault_id": "uuid",
  "action_type": "source_created",
  "actor_id": "user_uuid",
  "metadata": {
    "source_id": "uuid",
    "title": "Source Title"
  }
}
```

**Response**:
```json
{
  "id": "activity_log_uuid",
  "vault_id": "vault_uuid",
  "action_type": "source_created",
  "actor_id": "user_uuid",
  "metadata": {...},
  "timestamp": "2024-02-14T10:30:00Z"
}
```

**Action Types**:
- `vault_created`, `vault_updated`, `vault_deleted`, `vault_archived`
- `source_created`, `source_updated`, `source_deleted`
- `annotation_created`, `annotation_updated`, `annotation_deleted`
- `file_uploaded`, `file_deleted`
- `member_added`, `member_removed`, `member_role_changed`

## Storage

### Bucket: vault-files

- **Purpose**: Store PDF documents securely
- **Access**: Private (authenticated only)
- **Size Limit**: 50MB per file
- **Allowed Types**: application/pdf

**Folder Structure**:
```
vault-files/
├── {vault_id}/
│   ├── 1707884400000-document.pdf
│   └── 1707884500000-article.pdf
└── {vault_id}/
    └── ...
```

## Authentication

- **Provider**: Supabase Auth (JWT)
- **Methods**: Email/Password, OAuth (Google, GitHub, etc.)
- **Session**: Persistent across tabs via localStorage
- **Token Expiry**: 1 hour (refreshed automatically)

## Environment Variables

Create `.env.local` in the `frontend/` folder:

```env
# Supabase URLs and Keys
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres

# External APIs
CROSSREF_API_URL=https://api.crossref.org/v1
```

## Development

### Local Development

```bash
# Start local Supabase stack
supabase start

# This starts:
# - PostgreSQL database
# - PostgREST API
# - Realtime server
# - Vector server
```

### Test Functions Locally

```bash
# View function logs
supabase functions list

# Deploy specific function
supabase functions deploy auto-citation

# Test function (need .env.local with credentials)
curl -X POST http://localhost:54321/functions/v1/auto-citation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://doi.org/10.1038/nature12373","style":"apa"}'
```

### Database Inspection

```bash
# View migrations status
supabase db pull

# Create new migration
supabase migration new migration_name

# Reset database (⚠️ deletes all data)
supabase db reset
```

## Deployment

### Deploy to Production

```bash
# Push migrations
supabase db push --linked

# Deploy functions
supabase functions deploy --linked auto-citation
supabase functions deploy --linked activity-logger
```

### Monitor

```bash
# View Edge Function logs
supabase functions list --linked

# Check database stats
# Go to Supabase Dashboard → Database → Overview
```

## Security Checklist

- [ ] All RLS policies enabled
- [ ] Service role key never in frontend code
- [ ] JWT secret configured
- [ ] Storage bucket policies configured
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled (optional)
- [ ] Backup schedule configured
- [ ] Monitoring & alerts configured

## Troubleshooting

### Migrations Won't Apply

```bash
# Check migration status
supabase status

# View migration logs
supabase db pull

# Reset and re-run
supabase db reset
supabase db push
```

### Functions Not Deploying

```bash
# Check local version
supabase --version

# Update CLI
npm install -g supabase@latest

# Deploy with verbose output
supabase functions deploy --verbose
```

### RLS Errors

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View policies
SELECT schemaname, tablename, policyname, permissive
FROM pg_policies
WHERE schemaname = 'public';
```

### Realtime Not Working

- Enable realtime in Supabase Dashboard
- Check table name matches subscription
- Verify user has SELECT permission on table

## Performance Tuning

### Optimize Queries

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM sources WHERE vault_id = '...';

-- Add missing indexes if needed
CREATE INDEX idx_sources_created_by ON sources(created_by);
```

### Connection Pooling

- Production uses PgBouncer (managed by Supabase)
- Default pool size: 100 connections

### Caching

Use Supabase Caching headers for read operations:

```typescript
const { data } = await supabase
  .from('sources')
  .select()
  .cache('60')  // Cache for 60 seconds
```

## API Rate Limits

- Supabase free tier: Unlimited API calls
- Edge Functions: 1 million invocations/month (free)
- Storage: 1GB included

## Support & Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [PostgREST Docs](https://postgrest.org/)

---

**Version**: 1.0.0  
**Last Updated**: February 14, 2026
