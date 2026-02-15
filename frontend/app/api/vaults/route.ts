import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/vaults – list vaults for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const supabase = createServerSupabaseClient();

    // Get vaults the user owns
    const { data: ownedVaults, error: ownedError } = await supabase
      .from('vaults')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (ownedError) {
      return NextResponse.json({ error: ownedError.message }, { status: 500 });
    }

    // Get vaults the user is a member of (but doesn't own)
    const { data: memberships } = await supabase
      .from('vault_members')
      .select('vault_id')
      .eq('user_id', user.id);

    const memberVaultIds = (memberships || [])
      .map((m) => m.vault_id)
      .filter((id) => !ownedVaults?.some((v) => v.id === id));

    let memberVaults: any[] = [];
    if (memberVaultIds.length > 0) {
      const { data } = await supabase
        .from('vaults')
        .select('*')
        .in('id', memberVaultIds)
        .order('created_at', { ascending: false });
      memberVaults = data || [];
    }

    const allVaults = [...(ownedVaults || []), ...memberVaults].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // If a specific vault ID was requested and not found in user's vaults,
    // check if it's a public vault so non-members can still view it
    const requestedId = request.nextUrl.searchParams.get('id');
    if (requestedId && !allVaults.some((v) => v.id === requestedId)) {
      const { data: publicVault } = await supabase
        .from('vaults')
        .select('*')
        .eq('id', requestedId)
        .eq('is_public', true)
        .single();

      if (publicVault) {
        return NextResponse.json({ data: [...allVaults, publicVault] });
      }
    }

    return NextResponse.json({ data: allVaults });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/vaults – create a new vault
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { name, description, is_public } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vaults')
      .insert({ name, description, owner_id: user.id, is_public: is_public ?? false })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add creator as owner member
    await supabase.from('vault_members').insert({
      vault_id: data.id,
      user_id: user.id,
      role: 'owner',
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      vault_id: data.id,
      action_type: 'vault_created',
      actor_id: user.id,
      metadata: { name: data.name },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/vaults – delete a vault (pass ?id=xxx)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const vaultId = searchParams.get('id');

    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: vault } = await supabase
      .from('vaults')
      .select('owner_id')
      .eq('id', vaultId)
      .single();

    if (!vault || vault.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only vault owners can delete vaults' }, { status: 403 });
    }

    const { error } = await supabase.from('vaults').delete().eq('id', vaultId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
