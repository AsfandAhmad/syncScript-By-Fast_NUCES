/**
 * Notification Service (backend side)
 *
 * Logs significant events that arrive via Supabase Realtime.
 * In a production system this could forward to Slack, email, or
 * a WebSocket broadcast to connected clients.
 *
 * For the hackathon this provides structured server-side logging
 * and can be extended later.
 */

/** Human-readable labels for each table + event combination */
const LABELS = {
  'sources:INSERT':       'New source added',
  'sources:UPDATE':       'Source updated',
  'sources:DELETE':       'Source removed',
  'annotations:INSERT':   'Annotation added',
  'annotations:UPDATE':   'Annotation updated',
  'annotations:DELETE':   'Annotation removed',
  'vault_members:INSERT': 'Contributor added to vault',
  'vault_members:UPDATE': 'Member role updated',
  'vault_members:DELETE': 'Member removed from vault',
  'vaults:UPDATE':        'Vault updated',
  'vaults:DELETE':        'Vault deleted',
};

/**
 * Called by the realtime service when a change happens.
 *
 * @param {string} table   - Table name (sources, annotations, etc.)
 * @param {string} event   - INSERT | UPDATE | DELETE
 * @param {object} payload - Supabase realtime payload
 */
function notifyBackend(table, event, payload) {
  const key = `${table}:${event}`;
  const label = LABELS[key] || `${table} ${event}`;
  const vaultId = payload.new?.vault_id || payload.old?.vault_id || payload.new?.id || payload.old?.id;

  console.info(`[notification] ${label}  vault=${vaultId || 'unknown'}  event=${event}`);

  // --- Extend here ---
  // e.g. push to a WebSocket room, send Slack webhook, etc.
}

module.exports = { notifyBackend };
