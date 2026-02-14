import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/vaults/[id]/members – list members of a vault
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('vault_members')
      .select('*')
      .eq('vault_id', vaultId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/vaults/[id]/members – add a member to a vault
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'user_id and role are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vault_members')
      .insert({ vault_id: vaultId, user_id, role })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert({
      vault_id: vaultId,
      action_type: 'member_added',
      actor_id: userData.user?.id,
      metadata: { member_user_id: user_id, role },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/vaults/[id]/members – remove a member from a vault
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('vault_members')
      .delete()
      .eq('vault_id', vaultId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert({
      vault_id: vaultId,
      action_type: 'member_removed',
      actor_id: userData.user?.id,
      metadata: { member_user_id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
