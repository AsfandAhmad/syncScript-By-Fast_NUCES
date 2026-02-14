import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from './supabase-server';
import type { User } from '@supabase/supabase-js';

/**
 * Extracts and verifies the user from an API request.
 * Reads the JWT from the Authorization header and verifies it
 * using the service_role client.
 */
export async function getAuthUser(request: NextRequest): Promise<{
  user: User | null;
  error: string | null;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { user: null, error: 'Missing authorization token' };
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: String(err) };
  }
}

/**
 * Returns a 401 response for unauthorized requests.
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}
