/**
 * Notification Service (backend side)
 *
 * When a realtime event arrives, this service:
 *  1. Logs the event (structured server-side logging)
 *  2. Writes a persistent notification row for every vault member
 *     (except the actor) so it appears in the NotificationCenter bell icon.
 */

const { createClient } = require('@supabase/supabase-js');

/** Human-readable labels for each table + event combination */
const LABELS = {
  'sources:INSERT':       { title: 'New source added',           type: 'source_added' },
  'sources:UPDATE':       { title: 'Source updated',              type: 'source_added' },
  'sources:DELETE':       { title: 'Source removed',              type: 'source_added' },
  'annotations:INSERT':   { title: 'Annotation added',           type: 'annotation_added' },
  'annotations:UPDATE':   { title: 'Annotation updated',         type: 'annotation_added' },
  'annotations:DELETE':   { title: 'Annotation removed',         type: 'annotation_added' },
  'vault_members:INSERT': { title: 'Contributor added to vault', type: 'member_added' },
  'vault_members:UPDATE': { title: 'Member role updated',        type: 'member_added' },
  'vault_members:DELETE': { title: 'Member removed from vault',  type: 'member_added' },
  'vaults:UPDATE':        { title: 'Vault updated',              type: 'member_added' },
  'vaults:DELETE':        { title: 'Vault deleted',              type: 'member_added' },
  'files:INSERT':         { title: 'File uploaded',              type: 'file_uploaded' },
  'files:UPDATE':         { title: 'File updated',               type: 'file_uploaded' },
  'files:DELETE':         { title: 'File deleted',               type: 'file_uploaded' },
};

/** Lazily initialised Supabase client (service_role) */
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    _supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabase;
}

/**
 * Called by the realtime service when a DB change happens.
 * Writes a notification row for every vault member (except the actor).
 */
async function notifyBackend(table, event, payload) {
  const key = `${table}:${event}`;
  const info = LABELS[key] || { title: `${table} ${event}`, type: 'source_added' };
  const record = payload.new || payload.old || {};
  const vaultId = record.vault_id || record.id;
  const actorId = record.created_by || record.uploaded_by || record.actor_id || record.user_id || null;

  console.info(`[notification] ${info.title}  vault=${vaultId || 'unknown'}  event=${event}`);

  if (!vaultId) return;

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // Fetch all members of this vault
    const { data: members } = await supabase
      .from('vault_members')
      .select('user_id')
      .eq('vault_id', vaultId);

    if (!members || members.length === 0) return;

    // Build a description with more context
    let message = info.title;
    if (record.title) message += `: "${record.title}"`;
    if (record.file_name) message += `: "${record.file_name}"`;
    if (record.name) message += `: "${record.name}"`;

    // Create notification for each member except the actor
    const rows = members
      .filter((m) => m.user_id !== actorId)
      .map((m) => ({
        user_id: m.user_id,
        vault_id: vaultId,
        type: info.type,
        title: info.title,
        message,
        metadata: { table, event, record_id: record.id },
      }));

    if (rows.length === 0) return;

    const { error } = await supabase.from('notifications').insert(rows);
    if (error) {
      // Table may not exist yet — log but don't crash
      console.warn('[notification] Failed to write notifications:', error.message);
    } else {
      console.info(`[notification] Wrote ${rows.length} notification(s) for vault ${vaultId}`);
    }
  } catch (err) {
    console.error('[notification] Error:', err.message);
  }
}

module.exports = { notifyBackend };
