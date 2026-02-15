/**
 * Vault Controller
 *
 * Handles GET /vault/:id and GET /vault/:id/sources
 * with Redis caching (Upstash) and Supabase fallback.
 *
 * Cache keys:
 *   vault:{id}          → vault details
 *   vault:{id}:sources  → paginated sources list
 */

const cache = require('../services/cacheService');
const { getSupabase } = require('../services/realtimeService');
const { createClient } = require('@supabase/supabase-js');

/** Default and max page sizes for source pagination */
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Lazily create a Supabase client for direct DB queries.
 * Re-uses the one from realtimeService when available.
 */
function getClient() {
  const existing = getSupabase();
  if (existing) return existing;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key, { auth: { persistSession: false } });
}

/* ------------------------------------------------------------------ */
/*  GET /vault/:id                                                      */
/* ------------------------------------------------------------------ */

async function getVault(req, res) {
  const { id } = req.params;
  const cacheKey = `vault:${id}`;

  try {
    // 1. Check cache
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ data: cached, source: 'cache' });

    // 2. Fetch from Supabase
    const supabase = getClient();
    const { data, error } = await supabase
      .from('vaults')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: error.message });

    // 3. Store in cache
    await cache.set(cacheKey, data);

    return res.json({ data, source: 'database' });
  } catch (err) {
    console.error('[vaultController] getVault error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /vault/:id/sources?page=1&limit=20                             */
/* ------------------------------------------------------------------ */

async function getVaultSources(req, res) {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;
  const cacheKey = `vault:${id}:sources:p${page}:l${limit}`;

  try {
    // 1. Check cache
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ ...cached, source: 'cache' });

    // 2. Fetch from Supabase with pagination
    const supabase = getClient();
    const { data, error, count } = await supabase
      .from('sources')
      .select('*', { count: 'exact' })
      .eq('vault_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: error.message });

    const result = {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };

    // 3. Store in cache
    await cache.set(cacheKey, result);

    return res.json({ ...result, source: 'database' });
  } catch (err) {
    console.error('[vaultController] getVaultSources error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getVault, getVaultSources };
