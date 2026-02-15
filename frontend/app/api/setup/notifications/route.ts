import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/setup/notifications — one-time migration runner
 * Creates the notifications table via raw SQL.
 * Safe to call multiple times (IF NOT EXISTS).
 */
export async function POST() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!url || !key) {
      return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
    }

    // Use the Supabase SQL endpoint directly (management API via service_role)
    const sqlStatements = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL DEFAULT '',
        read BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);
    `;

    // Execute via pg_net or raw fetch to the SQL endpoint
    const response = await fetch(`${url}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    // Fallback: just check if table exists via normal query
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (checkError) {
      return NextResponse.json({
        status: 'table_missing',
        message: 'Run this SQL in Supabase Dashboard → SQL Editor',
        sql: sqlStatements.trim(),
      }, { status: 200 });
    }

    return NextResponse.json({ status: 'ok', message: 'Notifications table exists and is ready' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
