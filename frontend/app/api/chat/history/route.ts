import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/chat/history?vaultId=xxx — get chat history for the current user in a vault
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) return unauthorizedResponse(authError || undefined);

    const vaultId = request.nextUrl.searchParams.get('vaultId');
    if (!vaultId) {
      return NextResponse.json({ error: 'vaultId is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Find conversation
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('vault_id', vaultId)
      .eq('user_id', user.id)
      .single();

    if (!conv) {
      return NextResponse.json({ data: [], conversationId: null });
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: messages || [], conversationId: conv.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/history?vaultId=xxx — clear chat history
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) return unauthorizedResponse(authError || undefined);

    const vaultId = request.nextUrl.searchParams.get('vaultId');
    if (!vaultId) {
      return NextResponse.json({ error: 'vaultId is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Find and delete conversation (cascade deletes messages)
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('vault_id', vaultId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
