'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import supabase from '@/lib/supabase-client';

/**
 * OAuth callback page.
 *
 * After Google / LinkedIn redirects back with a ?code=… query-param,
 * the Supabase client SDK exchanges it for a session (PKCE flow).
 * Once the session is established we redirect to /dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      try {
        // The Supabase JS v2 client automatically detects the ?code=
        // query parameter and exchanges it for a session when we call
        // getSession() or when onAuthStateChange fires.
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('[auth/callback] Session error:', error.message);
          router.replace('/login?error=oauth_callback_failed');
          return;
        }

        if (session) {
          // Session established — go to dashboard
          router.replace('/dashboard');
        } else {
          // No session yet — wait a moment for onAuthStateChange to fire
          // (the SDK detects the hash fragment / code param automatically)
          const timeout = setTimeout(() => {
            router.replace('/login?error=no_session');
          }, 5000);

          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              clearTimeout(timeout);
              subscription.unsubscribe();
              router.replace('/dashboard');
            }
          });
        }
      } catch (err) {
        console.error('[auth/callback] Unexpected error:', err);
        router.replace('/login?error=oauth_callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
