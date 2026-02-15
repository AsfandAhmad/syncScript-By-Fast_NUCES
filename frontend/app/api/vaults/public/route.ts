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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with owner name/email and membership status
    const enriched = await Promise.all(
      (vaults || []).map(async (vault) => {
        // Get owner info
        let owner_email: string | null = null;
        let owner_name: string | null = null;
        try {
          const {
            data: { user: ownerUser },
          } = await supabase.auth.admin.getUserById(vault.owner_id);
          owner_email = ownerUser?.email ?? null;
          owner_name =
            ownerUser?.user_metadata?.full_name ??
            ownerUser?.user_metadata?.name ??
            null;
        } catch {
          // non-critical
        }

        // Check if current user is a member
        let is_member = false;
        if (currentUserId) {
          const { data: membership } = await supabase
            .from('vault_members')
            .select('id')
            .eq('vault_id', vault.id)
            .eq('user_id', currentUserId)
            .maybeSingle();
          is_member = !!membership;
        }

        return {
          ...vault,
          owner_email,
          owner_name,
          is_member,
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
