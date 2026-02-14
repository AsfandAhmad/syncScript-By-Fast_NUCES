import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/vaults/[id]/activity – list activity logs for a vault
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('vault_id', vaultId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
