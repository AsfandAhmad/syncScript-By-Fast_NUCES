import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { indexSource, deleteChunks } from '@/lib/rag/auto-index';

/**
 * GET /api/sources/[id] – get a specific source
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

    const { id: sourceId } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (error) {
      const status = error.code === 'PGRST116' ? 404 : 500;
      return NextResponse.json({ error: status === 404 ? 'Source not found' : error.message }, { status });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * PATCH /api/sources/[id] – update a source
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { id: sourceId } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Get current version for optimistic locking
    const { data: currentSource } = await supabase
      .from('sources')
      .select('version, vault_id')
      .eq('id', sourceId)
      .single();

    if (!currentSource) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('sources')
      .update({
        ...body,
        version: (currentSource.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      vault_id: currentSource.vault_id,
      action_type: 'source_updated',
      actor_id: user.id,
      metadata: { source_id: sourceId },
    });

    // Re-index source for RAG chatbot
    indexSource(sourceId, currentSource.vault_id).catch(() => {});

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/sources/[id] – delete a source
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { id: sourceId } = await params;
    const supabase = createServerSupabaseClient();

    // Get vault_id for activity log before deleting
    const { data: source } = await supabase
      .from('sources')
      .select('vault_id')
      .eq('id', sourceId)
      .single();

    const { error } = await supabase.from('sources').delete().eq('id', sourceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    if (source) {
      await supabase.from('activity_logs').insert({
        vault_id: source.vault_id,
        action_type: 'source_deleted',
        actor_id: user.id,
        metadata: { source_id: sourceId },
      });
    }

    // Remove RAG embeddings
    deleteChunks('source', sourceId).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
