import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/annotations?source_id=xxx – list annotations for a source
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('source_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!sourceId) {
      return NextResponse.json({ error: 'source_id is required' }, { status: 400 });
    }

    // Get count
    const { count } = await supabase
      .from('annotations')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', sourceId);

    // Get data
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('source_id', sourceId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count: count || 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/annotations – create a new annotation
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { source_id, content } = body;

    if (!source_id || !content) {
      return NextResponse.json({ error: 'source_id and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('annotations')
      .insert({
        source_id,
        content,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    const { data: source } = await supabase
      .from('sources')
      .select('vault_id')
      .eq('id', source_id)
      .single();

    if (source) {
      await supabase.from('activity_logs').insert({
        vault_id: source.vault_id,
        action_type: 'annotation_created',
        actor_id: user.id,
        metadata: { annotation_id: data.id, source_id },
      });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
