import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/vaults/[id]/members – list members of a vault
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

    const { data, error } = await supabase
      .from('vault_members')
      .select('*')
      .eq('vault_id', vaultId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Resolve user emails/names from Supabase Auth
    const enriched = await Promise.all(
      (data || []).map(async (member) => {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
          return {
            ...member,
            email: userData?.user?.email || member.user_id,
            full_name: userData?.user?.user_metadata?.full_name || null,
          };
        } catch {
          return { ...member, email: member.user_id, full_name: null };
        }
      })
    );

    return NextResponse.json({ data: enriched });
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
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    let { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'user_id (or email) and role are required' },
        { status: 400 }
      );
    }

    // Allow 'self' as shorthand for the authenticated user (used by Join button)
    if (user_id === 'self') {
      user_id = user.id;
      // When self-joining a public vault, force role to viewer
      const { data: vault } = await supabase
        .from('vaults')
        .select('is_public')
        .eq('id', vaultId)
        .single();
      if (!vault?.is_public) {
        return NextResponse.json(
          { error: 'This vault is not public. You cannot self-join.' },
          { status: 403 }
        );
      }
      role = 'viewer';
    }

    // If user_id looks like an email, resolve it to a UUID
    if (user_id.includes('@')) {
      const listResult = await supabase.auth.admin.listUsers();
      if (listResult.error) {
        return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 });
      }
      const found = listResult.data.users.find(
        (u: any) => u.email?.toLowerCase() === user_id.toLowerCase()
      );
      if (!found) {
        return NextResponse.json(
          { error: `No user found with email "${user_id}"` },
          { status: 404 }
        );
      }
      user_id = found.id;
    }

    // Check if user is already a member
    const { data: existing } = await supabase
      .from('vault_members')
      .select('id')
      .eq('vault_id', vaultId)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This user is already a member of this vault' },
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
    await supabase.from('activity_logs').insert({
      vault_id: vaultId,
      action_type: 'member_added',
      actor_id: user.id,
      metadata: { member_user_id: user_id, role },
    });

    // Notify added member
    try {
      const { data: vault } = await supabase.from('vaults').select('name').eq('id', vaultId).single();
      await supabase.from('notifications').insert({
        user_id: user_id,
        vault_id: vaultId,
        type: 'member_added',
        title: 'Added to vault',
        message: `You've been added as ${role} to "${vault?.name || 'a vault'}"`,
        metadata: { vault_id: vaultId, role },
      });
    } catch {
      // notifications table may not exist yet – non-critical
    }

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
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

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
    await supabase.from('activity_logs').insert({
      vault_id: vaultId,
      action_type: 'member_removed',
      actor_id: user.id,
      metadata: { member_user_id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
