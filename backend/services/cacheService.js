/**
 * Redis Cache Service (Upstash)
 *
 * Provides get / set / invalidate helpers with a default TTL of 60 seconds.
 * All methods are async and handle errors gracefully — a cache miss or
 * Redis failure never crashes the server; it simply falls through to Supabase.
 */

const { Redis } = require('@upstash/redis');

const CACHE_TTL_SECONDS = 60;

/* ------------------------------------------------------------------ */
/*  Singleton Redis client                                              */
/* ------------------------------------------------------------------ */

let redis = null;

function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('[cache] Upstash Redis env vars missing — caching disabled');
      return null;
    }

    redis = new Redis({ url, token });
    console.info('[cache] Upstash Redis client initialized');
  }
  return redis;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Retrieve a value from Redis.
 * Returns `null` on miss or if Redis is unavailable.
 */
async function get(key) {
  try {
    const client = getRedis();
    if (!client) return null;

    const value = await client.get(key);
    if (value !== null && value !== undefined) {
      console.info(`[cache] HIT  ${key}`);
      return typeof value === 'string' ? JSON.parse(value) : value;
    }
    console.info(`[cache] MISS ${key}`);
    return null;
  } catch (err) {
    console.error(`[cache] GET error for ${key}:`, err.message);
    return null;
  }
}

/**
 * Store a value in Redis with the default TTL.
 */
async function set(key, value, ttl = CACHE_TTL_SECONDS) {
  try {
    const client = getRedis();
    if (!client) return;

    await client.set(key, JSON.stringify(value), { ex: ttl });
    console.info(`[cache] SET  ${key}  (TTL ${ttl}s)`);
  } catch (err) {
    console.error(`[cache] SET error for ${key}:`, err.message);
  }
}

/**
 * Delete one or more cache keys (cache invalidation).
 */
async function invalidate(...keys) {
  try {
    const client = getRedis();
    if (!client) return;

    await Promise.all(keys.map((k) => client.del(k)));
    console.info(`[cache] INVALIDATED  ${keys.join(', ')}`);
  } catch (err) {
    console.error('[cache] INVALIDATE error:', err.message);
  }
}

module.exports = { get, set, invalidate, CACHE_TTL_SECONDS };
