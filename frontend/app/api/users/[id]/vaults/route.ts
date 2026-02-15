import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/users/[id]/vaults – list vaults that a user owns or is a member of.
 * For each vault it also returns whether the requesting user is already a member.
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

    const { id: targetUserId } = await params;
    const supabase = createServerSupabaseClient();

    // Get all vault memberships for the target user
    const { data: memberships, error: memErr } = await supabase
      .from('vault_members')
      .select('vault_id, role')
      .eq('user_id', targetUserId);

    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const vaultIds = memberships.map((m) => m.vault_id);

    // Fetch vault details
    const { data: vaults, error: vaultErr } = await supabase
      .from('vaults')
      .select('*')
      .in('id', vaultIds)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (vaultErr) {
      return NextResponse.json({ error: vaultErr.message }, { status: 500 });
    }

    // Check which of these vaults the requesting user is already a member of
    const { data: myMemberships } = await supabase
      .from('vault_members')
      .select('vault_id, role')
      .eq('user_id', user.id)
      .in('vault_id', vaultIds);

    const myVaultMap = new Map(
      (myMemberships || []).map((m) => [m.vault_id, m.role])
    );

    // Build response with membership info
    const result = (vaults || []).map((v) => ({
      ...v,
      target_user_role: memberships.find((m) => m.vault_id === v.id)?.role,
      current_user_role: myVaultMap.get(v.id) || null,
      is_member: myVaultMap.has(v.id),
    }));

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
