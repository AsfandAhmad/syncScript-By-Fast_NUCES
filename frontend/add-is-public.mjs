// Temporary script to add is_public column via direct Postgres connection
// Run with: node --env-file=.env.local add-is-public.mjs

import pg from 'pg';
const { Client } = pg;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_KEY');
  process.exit(1);
}

// Extract project ref from URL
const ref = new URL(SUPABASE_URL).hostname.split('.')[0];
console.log(`Project ref: ${ref}`);

// Step 1: Check if column exists via REST
console.log('Checking if is_public column exists...');
const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/vaults?select=is_public&limit=1`, {
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});

if (checkRes.ok) {
  console.log('✅ is_public column already exists! No migration needed.');
  process.exit(0);
}

console.log('⚠️  Column missing. Attempting direct Postgres connection...');

// Try multiple possible connection strings (Supabase pooler)
const regions = ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-southeast-1', 'eu-central-1'];
let connected = false;

for (const region of regions) {
  const connStr = `postgresql://postgres.${ref}:${SERVICE_KEY}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  
  try {
    console.log(`  Trying region ${region}...`);
    await client.connect();
    console.log(`  ✅ Connected via ${region} pooler!`);
    
    await client.query('ALTER TABLE vaults ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE');
    console.log('  ✅ Added is_public column');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_vaults_is_public ON vaults(is_public)');
    console.log('  ✅ Created index');
    
    await client.end();
    connected = true;
    break;
  } catch (e) {
    try { await client.end(); } catch {}
    if (e.message?.includes('timeout') || e.message?.includes('ENOTFOUND') || e.message?.includes('connect')) {
      continue; // try next region
    }
    console.log(`  Error: ${e.message}`);
  }
}

if (!connected) {
  // Try direct connection (non-pooler)
  const directStr = `postgresql://postgres:${SERVICE_KEY}@db.${ref}.supabase.co:5432/postgres`;
  const client = new Client({ connectionString: directStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
  try {
    console.log('  Trying direct connection...');
    await client.connect();
    await client.query('ALTER TABLE vaults ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vaults_is_public ON vaults(is_public)');
    await client.end();
    connected = true;
    console.log('  ✅ Column added via direct connection!');
  } catch (e) {
    try { await client.end(); } catch {}
    console.log(`  Direct failed: ${e.message}`);
  }
}

if (!connected) {
  console.log('\n❌ Could not connect to database.');
  console.log('Please run this SQL manually in Supabase Dashboard → SQL Editor:');
  console.log('ALTER TABLE vaults ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;');
  console.log('CREATE INDEX IF NOT EXISTS idx_vaults_is_public ON vaults(is_public);');
  process.exit(1);
}

// Verify
const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/vaults?select=is_public&limit=1`, {
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});
if (verifyRes.ok) {
  console.log('\n✅ Column verified successfully!');
} else {
  console.log('\n⚠️  Verification failed - column may need manual creation');
}
