import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/api-auth';

/**
 * GET /api/vaults/public – list all public vaults
 * Optionally uses auth to indicate which vaults the user already belongs to.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Soft auth – don't require it but use it if present
    let currentUserId: string | null = null;
    try {
      const { user } = await getAuthUser(request);
      if (user) currentUserId = user.id;
    } catch {
      // unauthenticated is fine for public listing
    }

    // Fetch all public vaults
    const { data: vaults, error } = await supabase
      .from('vaults')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[public-vaults] Query error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Collect unique owner IDs for batch lookup
    const ownerIds = [...new Set((vaults || []).map((v) => v.owner_id).filter(Boolean))];

    // Batch-fetch ALL users once instead of N sequential getUserById calls
    const ownerMap = new Map<string, { email: string | null; name: string | null }>();
    try {
      const listResult = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (!listResult.error && listResult.data?.users) {
        for (const u of listResult.data.users) {
          if (ownerIds.includes(u.id)) {
            ownerMap.set(u.id, {
              email: u.email ?? null,
              name: (u as any).user_metadata?.full_name ?? (u as any).user_metadata?.name ?? null,
            });
          }
        }
      }
    } catch {
      // Fallback: leave ownerMap empty
    }
    // Fill in any missing owners
    for (const ownerId of ownerIds) {
      if (!ownerMap.has(ownerId)) {
        ownerMap.set(ownerId, { email: null, name: null });
      }
    }

    // Batch-fetch membership for current user
    const membershipSet = new Set<string>();
    if (currentUserId && vaults && vaults.length > 0) {
      const vaultIds = vaults.map((v) => v.id);
      const { data: memberships } = await supabase
        .from('vault_members')
        .select('vault_id')
        .eq('user_id', currentUserId)
        .in('vault_id', vaultIds);

      if (memberships) {
        for (const m of memberships) membershipSet.add(m.vault_id);
      }
    }

    // Enrich vaults
    const enriched = (vaults || []).map((vault) => {
      const owner = ownerMap.get(vault.owner_id) || { email: null, name: null };
      return {
        ...vault,
        owner_email: owner.email,
        owner_name: owner.name,
        is_member: membershipSet.has(vault.id),
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error('[public-vaults] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
