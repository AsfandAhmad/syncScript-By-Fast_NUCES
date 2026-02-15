import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { indexAnnotation } from '@/lib/rag/auto-index';

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

    // Enrich annotations with author name/email
    const enriched = await Promise.all(
      (data || []).map(async (ann: Record<string, unknown>) => {
        if (!ann.created_by) return ann;
        try {
          const { data: { user: authorUser } } = await supabase.auth.admin.getUserById(
            ann.created_by as string
          );
          return {
            ...ann,
            author_email: authorUser?.email ?? null,
            author_name:
              authorUser?.user_metadata?.full_name ??
              authorUser?.user_metadata?.name ??
              null,
          };
        } catch {
          return ann;
        }
      })
    );

    return NextResponse.json({ data: enriched, count: count || 0 });
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

      // Notify vault members (excluding the annotator)
      const { data: members } = await supabase.from('vault_members').select('user_id').eq('vault_id', source.vault_id);
      if (members && members.length > 0) {
        const notifRows = members
          .filter((m) => m.user_id !== user.id)
          .map((m) => ({
            user_id: m.user_id,
            vault_id: source.vault_id,
            type: 'annotation_added',
            title: 'New annotation',
            message: `A new annotation was added to a source`,
            metadata: { vault_id: source.vault_id, source_id, annotation_id: data.id },
          }));
        if (notifRows.length > 0) {
          try { await supabase.from('notifications').insert(notifRows); } catch { /* table may not exist */ }
        }
      }
    }

    // Fire-and-forget: index annotation for RAG chatbot
    if (source) {
      indexAnnotation(data.id, source.vault_id).catch(() => {});
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
