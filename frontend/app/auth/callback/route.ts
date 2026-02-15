import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Auth callback handler for Supabase OAuth (Google, LinkedIn, etc.)
 *
 * After the provider redirects back with ?code=…, we exchange it for a
 * Supabase session, then redirect the user to /dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful — send user to the dashboard (or wherever "next" points)
      return NextResponse.redirect(new URL(next, origin));
    }

    console.error('[auth/callback] Code exchange failed:', error.message);
  }

  // Fallback: redirect to login with an error hint
  return NextResponse.redirect(
    new URL('/login?error=oauth_callback_failed', origin)
  );
}
