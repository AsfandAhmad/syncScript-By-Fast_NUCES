# Database Seeding Guide

This project includes a comprehensive database seeding system to populate your Supabase database with realistic dummy data.

## 📋 What Gets Seeded

- **3 Vaults** - Different types of knowledge bases (Research, Business, Learning)
- **4 Vault Members** - Different roles (owners, contributors, viewers)
- **7 Sources** - Various content types (PDFs, articles, courses, code repos)
- **5 Annotations** - Comments and notes on sources
- **5 Files** - Uploaded documents with checksums
- **10 Activity Logs** - Audit trail of all actions

## 🚀 How to Use

### Option 1: Using the API Endpoint (Easiest)

**In Development:**
```bash
# Start your dev server first
cd frontend
npm run dev

# In another terminal, call the seed endpoint
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json"
```

**In Production:**
```bash
# You need a SEED_API_TOKEN environment variable
curl -X POST https://your-domain.com/api/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SEED_API_TOKEN"
```

### Option 2: Using npm Script

```bash
cd frontend

# Make sure you have ts-node installed
npm install --save-dev ts-node

# Run the seeding script
npm run seed
```

### Option 3: Direct Node Execution

```bash
cd frontend

# Run the seed data directly
node -r ts-node/register -e "
const seedDatabase = require('./lib/seed-data.ts').default;
seedDatabase().then(() => process.exit(0));
"
```

### Option 4: Using the Shell Script

```bash
# Make the script executable
chmod +x seed-db.sh

# Run it
./seed-db.sh
```

## ⚙️ Configuration

### Update User IDs

The seeding script uses these placeholder user IDs:
- `550e8400-e29b-41d4-a716-446655440001` - Primary user (vault owner)
- `550e8400-e29b-41d4-a716-446655440002` - Secondary user
- `550e8400-e29b-41d4-a716-446655440003` - Third user

**To use your actual users:**

1. Find your Supabase Auth user IDs:
   - Go to Supabase Dashboard → Authentication → Users
   - Copy the UUID for each user

2. Edit `frontend/lib/seed-data.ts`:
   ```typescript
   const DEMO_USER_ID = 'YOUR_ACTUAL_USER_ID';
   const DEMO_USER_ID_2 = 'YOUR_SECOND_USER_ID';
   const DEMO_USER_ID_3 = 'YOUR_THIRD_USER_ID';
   ```

3. Re-run the seeding

### Environment Variables

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔒 Security Notes

- The `/api/seed` endpoint is **unrestricted in development**
- In production, it requires a `SEED_API_TOKEN` header
- Only use seeding in development/staging environments
- Never commit real user data to version control

## 📊 Seeding Output

Successful seeding will show:
```
🌱 Starting database seeding...
📦 Creating vaults...
✅ Created 3 vaults
👥 Adding vault members...
✅ Added 4 vault members
📄 Adding sources...
✅ Added 7 sources
💬 Adding annotations...
✅ Added 5 annotations
📁 Adding files...
✅ Added 5 files
📊 Adding activity logs...
✅ Added 10 activity logs

✨ Database seeding completed successfully!

📊 Summary:
   • 3 Vaults
   • 4 Vault Members
   • 7 Sources
   • 5 Annotations
   • 5 Files
   • 10 Activity Logs
```

## 🔄 Clear and Re-seed

If you want to start fresh:

1. **Delete all data manually** in Supabase:
   ```sql
   DELETE FROM activity_logs;
   DELETE FROM files;
   DELETE FROM annotations;
   DELETE FROM sources;
   DELETE FROM vault_members;
   DELETE FROM vaults;
   ```

2. **Re-run seeding** to populate fresh data

## 🐛 Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL not found"
- Make sure `.env.local` is in the `frontend` directory
- Restart your dev server after adding env vars

### "Service role key missing"
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Get it from: Supabase Dashboard → Settings → API

### "User not found" errors
- Replace placeholder UUIDs with real Supabase Auth user IDs
- User must exist in `auth.users` table before seeding

### "Foreign key constraint violation"
- This usually means users don't exist
- Create users first via Supabase Auth or create them manually

## ✅ Next Steps After Seeding

1. Login to your app with one of the seeded users
2. Navigate to dashboard - you should see the 3 seeded vaults
3. Click on a vault to see sources, files, and annotations
4. Check the activity feed to see action history

Enjoy your seeded database! 🎉
