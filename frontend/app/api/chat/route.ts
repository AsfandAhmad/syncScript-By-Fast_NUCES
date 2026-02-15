import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { retrieveChunks, formatContext } from '@/lib/rag/retriever';
import { buildSystemPrompt, buildMessages } from '@/lib/rag/prompt';
import type { ChatMessage } from '@/lib/database.types';

// Models to try in order — first available free-tier model wins
const LLM_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemma-3-4b-it',
];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

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

    // 9. Stream from Gemini (direct REST API with retry + model fallback)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Convert messages to Gemini format
    const geminiHistory = messages
      .filter((m) => m.role !== 'system')
      .slice(0, -1)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Build the request body for the REST API
    const requestBody: any = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        ...geminiHistory,
        { role: 'user', parts: [{ text: question }] },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    };

    // Try each model with retries
    let geminiResponse: Response | null = null;
    let usedModel = '';

    for (const modelName of LLM_MODELS) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;

        try {
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (resp.ok) {
            geminiResponse = resp;
            usedModel = modelName;
            break;
          }

          const status = resp.status;
          if (status === 429) {
            console.warn(`[chat] 429 from ${modelName} (attempt ${attempt + 1}). Retrying...`);
            if (attempt < MAX_RETRIES) {
              await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
              continue;
            }
            // Exhausted retries for this model, try next
            break;
          }

          if (status === 404) {
            console.warn(`[chat] Model ${modelName} not found, trying next...`);
            break; // skip retries, go to next model
          }

          // Other error — try next model
          const errText = await resp.text();
          console.error(`[chat] ${modelName} returned ${status}: ${errText.slice(0, 200)}`);
          break;
        } catch (fetchErr) {
          console.error(`[chat] Fetch error for ${modelName}:`, fetchErr);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
            continue;
          }
          break;
        }
      }

      if (geminiResponse) break;
    }

    if (!geminiResponse) {
      return NextResponse.json(
        { error: 'All Gemini models exhausted. Please wait a moment and try again.' },
        { status: 503 }
      );
    }

    console.log(`[chat] Using model: ${usedModel}`);

    // 10. Stream response via ReadableStream
    let fullResponse = '';
    const reader = geminiResponse.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: 'No response stream from Gemini' }, { status: 500 });
    }

    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE events from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // keep incomplete line

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const text =
                  parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) {
                  fullResponse += text;
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ type: 'text', content: text })}\n\n`
                    )
                  );
                }
              } catch {
                // skip unparseable chunk
              }
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
