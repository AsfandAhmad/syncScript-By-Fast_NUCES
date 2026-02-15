import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { retrieveChunks, formatContext } from '@/lib/rag/retriever';
import { buildSystemPrompt, buildMessages } from '@/lib/rag/prompt';
import type { ChatMessage } from '@/lib/database.types';

const LLM_MODEL = 'gemini-2.0-flash';

/**
 * POST /api/chat — RAG chatbot endpoint with streaming response.
 *
 * Body: { vaultId, question, conversationId? }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) return unauthorizedResponse(authError || undefined);

    const { vaultId, question, conversationId } = await request.json();
    if (!vaultId || !question) {
      return NextResponse.json({ error: 'vaultId and question are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // 2. Verify vault membership
    const { data: member } = await supabase
      .from('vault_members')
      .select('role')
      .eq('vault_id', vaultId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this vault' }, { status: 403 });
    }

    // 3. Get vault name
    const { data: vault } = await supabase
      .from('vaults')
      .select('name')
      .eq('id', vaultId)
      .single();

    const vaultName = vault?.name || 'Vault';

    // 4. Get or create conversation
    let convId = conversationId;
    if (!convId) {
      // Try to find existing conversation
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('vault_id', vaultId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        convId = existing.id;
      } else {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({
            vault_id: vaultId,
            user_id: user.id,
            title: question.slice(0, 100),
          })
          .select('id')
          .single();
        convId = newConv?.id;
      }
    }

    // 5. Save user message
    if (convId) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'user',
        content: question,
      });
    }

    // 6. Load conversation history
    let history: ChatMessage[] = [];
    if (convId) {
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(20);
      history = (msgs || []) as ChatMessage[];
    }

    // 7. Retrieve relevant chunks
    const chunks = await retrieveChunks(vaultId, question, 8, 0.4);
    const { contextText, citations } = formatContext(chunks);

    // 8. Build prompt
    const systemPrompt = buildSystemPrompt(vaultName, contextText);
    const messages = buildMessages(systemPrompt, history.slice(0, -1), question);

    // 9. Stream from Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: LLM_MODEL,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    });

    // Convert messages to Gemini format
    const geminiHistory = messages
      .filter((m) => m.role !== 'system')
      .slice(0, -1) // everything except last user message
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({
      history: geminiHistory as any,
      systemInstruction: {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
    });

    const streamResult = await chat.sendMessageStream(question);

    // 10. Stream response via ReadableStream
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              fullResponse += text;
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'text', content: text })}\n\n`
                )
              );
            }
          }

          // Send citations at the end
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'citations', citations, conversationId: convId })}\n\n`
            )
          );

          // Send done signal
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );

          // Save assistant message to DB
          if (convId && fullResponse) {
            await supabase.from('chat_messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: fullResponse,
              citations,
            });
          }

          controller.close();
        } catch (err) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'error', content: String(err) })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[chat] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
