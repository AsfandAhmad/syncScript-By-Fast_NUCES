import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * POST /api/vaults/[id]/request-access – request to join a vault.
 * Creates a notification for the vault owner.
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

    // Check the user is not already a member
    const { data: existing } = await supabase
      .from('vault_members')
      .select('id')
      .eq('vault_id', vaultId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You are already a member of this vault' },
        { status: 400 }
      );
    }

    // Get vault info
    const { data: vault } = await supabase
      .from('vaults')
      .select('name, owner_id')
      .eq('id', vaultId)
      .single();

    if (!vault) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
    }

    // Create a notification for the vault owner
    try {
      await supabase.from('notifications').insert({
        user_id: vault.owner_id,
        vault_id: vaultId,
        type: 'member_added', // reuse type for now
        title: 'Access requested',
        message: `${user.email} requested to join "${vault.name}"`,
        metadata: {
          vault_id: vaultId,
          requester_id: user.id,
          requester_email: user.email,
          request_type: 'access_request',
        },
      });
    } catch {
      // notifications table may not exist yet – non-critical
    }

    return NextResponse.json({ success: true, message: 'Access request sent to vault owner' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
