import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/annotations/[id] – get a specific annotation
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

    const { id: annotationId } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('id', annotationId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * PATCH /api/annotations/[id] – update an annotation
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

    const { id: annotationId } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Get current version
    const { data: current } = await supabase
      .from('annotations')
      .select('version, source_id')
      .eq('id', annotationId)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('annotations')
      .update({
        content: body.content,
        version: (current.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', annotationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    const { data: source } = await supabase
      .from('sources')
      .select('vault_id')
      .eq('id', current.source_id)
      .single();

    if (source) {
      await supabase.from('activity_logs').insert({
        vault_id: source.vault_id,
        action_type: 'annotation_updated',
        actor_id: user.id,
        metadata: { annotation_id: annotationId },
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/annotations/[id] – delete an annotation
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

    const { id: annotationId } = await params;
    const supabase = createServerSupabaseClient();

    // Get source info for activity log
    const { data: annotation } = await supabase
      .from('annotations')
      .select('source_id')
      .eq('id', annotationId)
      .single();

    const { error } = await supabase.from('annotations').delete().eq('id', annotationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    if (annotation) {
      const { data: source } = await supabase
        .from('sources')
        .select('vault_id')
        .eq('id', annotation.source_id)
        .single();

      if (source) {
        await supabase.from('activity_logs').insert({
          vault_id: source.vault_id,
          action_type: 'annotation_deleted',
          actor_id: user.id,
          metadata: { annotation_id: annotationId },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
