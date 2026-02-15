/**
 * Realtime Service — Supabase → Redis cache invalidation
 *
 * Subscribes to Supabase Realtime postgres_changes on the sources,
 * annotations, vault_members, and vaults tables.
 *
 * When a mutation is detected the relevant Redis keys are cleared
 * so the next API request fetches fresh data from Supabase.
 */

const { createClient } = require('@supabase/supabase-js');
const cache = require('./cacheService');
const { notifyBackend } = require('./notificationService');

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.warn('[realtime] Supabase env vars missing — listener disabled');
      return null;
    }

    supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabase;
}

/**
 * Start listening for realtime changes and invalidate Redis cache.
 * Call once at server boot.
 */
function startRealtimeListener() {
  const client = getSupabase();
  if (!client) return;

  const channel = client
    .channel('backend-cache-invalidation')
    // --- sources ---
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sources' },
      (payload) => {
        const vaultId = payload.new?.vault_id || payload.old?.vault_id;
        if (vaultId) {
          cache.invalidate(`vault:${vaultId}`, `vault:${vaultId}:sources`);
          notifyBackend('sources', payload.eventType, payload);
        }
      }
    )
    // --- annotations ---
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'annotations' },
      (payload) => {
        notifyBackend('annotations', payload.eventType, payload);
      }
    )
    // --- vault_members ---
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vault_members' },
      (payload) => {
        const vaultId = payload.new?.vault_id || payload.old?.vault_id;
        if (vaultId) {
          cache.invalidate(`vault:${vaultId}`);
          notifyBackend('vault_members', payload.eventType, payload);
        }
      }
    )
    // --- vaults ---
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vaults' },
      (payload) => {
        const vaultId = payload.new?.id || payload.old?.id;
        if (vaultId) {
          cache.invalidate(`vault:${vaultId}`, `vault:${vaultId}:sources`);
          notifyBackend('vaults', payload.eventType, payload);
        }
      }
    )
    // --- files ---
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'files' },
      (payload) => {
        const vaultId = payload.new?.vault_id || payload.old?.vault_id;
        if (vaultId) {
          cache.invalidate(`vault:${vaultId}`);
          notifyBackend('files', payload.eventType, payload);
        }
      }
    )
    .subscribe((status) => {
      console.info(`[realtime] Subscription status: ${status}`);
    });

  console.info('[realtime] Cache invalidation listener started');
  return channel;
}

module.exports = { startRealtimeListener, getSupabase };
