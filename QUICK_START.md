# SyncScript - Quick Start Guide

## ⚡ Get Running in 15 Minutes

### Step 1: Supabase Setup (5 min)

```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Save these from Settings → API:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 2: Run Migrations (3 min)

```bash
# Go to Supabase SQL Editor
# 1. Copy & run: supabase/migrations/001_init_schema.sql
# 2. Copy & run: supabase/migrations/002_enable_rls.sql
```

### Step 3: Deploy Functions (5 min)

```bash
npm install -g supabase
cd supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy auto-citation
supabase functions deploy activity-logger
```

### Step 4: Configure Frontend (2 min)

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) ✅

---

## 📋 Checklist

- [ ] Supabase project created
- [ ] Credentials saved
- [ ] Migrations applied (both files)
- [ ] Functions deployed (both)
- [ ] .env.local configured
- [ ] `npm install` complete
- [ ] `npm run dev` running
- [ ] No console errors

---

## 🧪 Quick Test

### Test 1: Authentication
```javascript
// In browser console:
const { data } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Password123!'
});
console.log('Signed up:', data.user?.email);
```

### Test 2: Database
```javascript
// In browser console:
const { data } = await supabase.from('vaults').select();
console.log('Vaults:', data);  // Should return []
```

### Test 3: Real-time
```javascript
// Open this in 2 browser tabs, run in both:
supabase.channel('test').on('postgres_changes',
  { event: '*', schema: 'public', table: 'vaults' },
  (payload) => console.log('Update:', payload)
).subscribe();

// In one tab, create a vault - watch console in other tab
```

---

## 📁 Key Files

| Path | Purpose |
|------|---------|
| `frontend/.env.local` | Credentials (keep secret!) |
| `supabase/migrations/001_init_schema.sql` | Database tables |
| `supabase/migrations/002_enable_rls.sql` | Security policies |
| `frontend/lib/services/` | API services |
| `frontend/hooks/use-auth.ts` | Authentication hooks |
| `frontend/app/api/` | Backend API routes |

---

## 🚀 Next: Build Your UI

Now that backend is ready:

1. Create login page (`frontend/app/login/`)
2. Create vault dashboard (`frontend/app/dashboard/`)
3. Add source management UI
4. Implement annotation editor
5. Build file uploader

Check `INTEGRATION_GUIDE.md` for detailed API docs.

---

## ⚠️ Common Issues

### "Unauthorized" Error
```bash
# Check 1: Are you logged in?
supabase.auth.getUser()

# Check 2: Is RLS enabled?
# Go to Supabase → Tables → Select table → Policies

# Check 3: Are migrations applied?
# Check Supabase SQL Editor → Run: SELECT * FROM vaults;
```

### Functions Return 404
```bash
# Check 1: Are they deployed?
supabase functions list

# Check 2: Correct function names?
# Should be: auto-citation, activity-logger

# Check 3: Re-deploy
supabase functions deploy auto-citation
supabase functions deploy activity-logger
```

### Real-time Not Working
```sql
-- In Supabase SQL Editor:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All should show: true
```

---

## 💡 Pro Tips

1. **Use TypeScript** - All services fully typed
2. **Check Activity Logs** - Debug via `activity_logs` table
3. **Test RLS** - Switch to different user role to verify
4. **Monitor Realtime** - Open DevTools → Network → WS
5. **Paginate Large Datasets** - Use `limit` & `offset` params

---

## 📖 Full Documentation

- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Complete setup
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production ready
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Verification
- [supabase/README.md](./supabase/README.md) - Backend details
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - What's implemented

---

## 🎯 Success Criteria

All working when:
- ✅ Sign up succeeds
- ✅ Logged in users see data (empty vault list)
- ✅ Database queries < 200ms
- ✅ Real-time updates < 1 second
- ✅ No console errors

---

**Ready to code!** 🚀

Questions? Check the detailed guides above or contact Supabase support.
