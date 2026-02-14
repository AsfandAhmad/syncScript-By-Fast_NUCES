import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/vaults/[id]/sources – list sources for a vault
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

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
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { url, title, metadata } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sources')
      .insert({
        vault_id: vaultId,
        url,
        title: title || 'Untitled Source',
        metadata: metadata || {},
        created_by: user.id,
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
      actor_id: user.id,
      metadata: { source_id: data.id, title: data.title },
    });

    // Notify vault members (excluding the creator)
    const { data: members } = await supabase.from('vault_members').select('user_id').eq('vault_id', vaultId);
    if (members && members.length > 0) {
      const notifRows = members
        .filter((m) => m.user_id !== user.id)
        .map((m) => ({
          user_id: m.user_id,
          vault_id: vaultId,
          type: 'source_added',
          title: 'New source added',
          message: `A new source "${data.title}" was added`,
          metadata: { vault_id: vaultId, source_id: data.id },
        }));
      if (notifRows.length > 0) await supabase.from('notifications').insert(notifRows);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
