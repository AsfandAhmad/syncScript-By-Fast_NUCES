import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/users/search?email=... – search users by email (partial match)
 * Returns basic user info (id, email, name) — no sensitive data.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email || email.length < 3) {
      return NextResponse.json(
        { error: 'Provide at least 3 characters to search' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Use the admin API to list users (service_role key has access)
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 20,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by email match (partial, case-insensitive) and exclude current user
    const matches = (data.users || [])
      .filter(
        (u) =>
          u.id !== user.id &&
          u.email?.toLowerCase().includes(email)
      )
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || null,
        created_at: u.created_at,
      }));

    return NextResponse.json({ data: matches });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
