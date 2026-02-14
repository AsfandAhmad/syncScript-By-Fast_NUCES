import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback handler for Supabase OAuth
 * Handles redirect after OAuth login
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    );
  }

  // Exchange code for session (handled by client-side SDK)
  // This endpoint can be extended for additional server-side logic

  // Redirect to the original destination or dashboard
  return NextResponse.redirect(new URL(next, request.url));
}
