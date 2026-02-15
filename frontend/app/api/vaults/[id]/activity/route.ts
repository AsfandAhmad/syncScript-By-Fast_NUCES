import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/vaults/[id]/activity – list activity logs for a vault
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
      .from('activity_logs')
      .select('*')
      .eq('vault_id', vaultId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich each log with actor name/email
    const uniqueActorIds = [...new Set((data || []).map((l: any) => l.actor_id).filter(Boolean))];
    const userMap: Record<string, { email: string; name: string }> = {};

    await Promise.all(
      uniqueActorIds.map(async (id) => {
        try {
          const { data: { user: u } } = await supabase.auth.admin.getUserById(id as string);
          if (u) {
            userMap[u.id] = {
              email: u.email || '',
              name: u.user_metadata?.full_name || u.user_metadata?.name || u.email || '',
            };
          }
        } catch {}
      })
    );

    const enriched = (data || []).map((log: any) => ({
      ...log,
      actor_name: log.actor_id ? userMap[log.actor_id]?.name || null : null,
      actor_email: log.actor_id ? userMap[log.actor_id]?.email || null : null,
    }));

    return NextResponse.json({ data: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
