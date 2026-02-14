import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/vaults/[id]/sources
 * Get all sources for a vault
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: sources, error, count } = await supabase
      .from('sources')
      .select('*', { count: 'exact' })
      .eq('vault_id', params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      sources,
      count,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/vaults/[id]/sources
 * Create a new source in a vault
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, title, metadata } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Source URL is required' },
        { status: 400 }
      );
    }

    const { data: source, error } = await supabase
      .from('sources')
      .insert({
        vault_id: params.id,
        url,
        title: title || 'Untitled Source',
        metadata: metadata || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      vault_id: params.id,
      action_type: 'source_created',
      actor_id: user.id,
      metadata: { source_id: source.id, title: source.title },
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
