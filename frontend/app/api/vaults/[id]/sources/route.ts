import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/vaults/[id]/sources – list sources for a vault
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error, count } = await supabase
      .from('sources')
      .select('*', { count: 'exact' })
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/vaults/[id]/sources – add a source to a vault
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { url, title, metadata } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('sources')
      .insert({
        vault_id: vaultId,
        url,
        title: title || 'Untitled Source',
        metadata: metadata || {},
        created_by: userData.user?.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      vault_id: vaultId,
      action_type: 'source_created',
      actor_id: userData.user?.id,
      metadata: { source_id: data.id, title: data.title },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
