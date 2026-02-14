import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/files/signed-url?path=xxx&expiresIn=3600
 * Returns a signed URL for a private storage file (uses service_role key).
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('path');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600', 10);

    if (!storagePath) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.storage
      .from('vault-files')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ url: data?.signedUrl || null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
