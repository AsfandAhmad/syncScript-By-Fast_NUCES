import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { retrieveChunks, formatContext } from '@/lib/rag/retriever';
import { buildSystemPrompt, buildMessages } from '@/lib/rag/prompt';
import type { ChatMessage } from '@/lib/database.types';

// Models to try in order — fastest free-tier models first
const LLM_MODELS = [
  'gemini-2.5-flash-lite',   // fastest, lightweight
  'gemini-2.5-flash',        // fast, capable (thinking disabled)
];

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

    // 3. Fetch vault info, members, conversation, and chunks ALL IN PARALLEL
    const [vaultRes, membersRes, convRes, chunksResult] = await Promise.all([
      // Vault details
      supabase.from('vaults').select('name, description, created_at, owner_id').eq('id', vaultId).single(),
      // Members
      supabase.from('vault_members').select('user_id, role, joined_at').eq('vault_id', vaultId),
      // Existing conversation
      conversationId
        ? Promise.resolve({ data: { id: conversationId } })
        : supabase.from('chat_conversations').select('id').eq('vault_id', vaultId).eq('user_id', user.id).single(),
      // RAG retrieval (embedding query + vector search) — catch errors so chat still works
      retrieveChunks(vaultId, question, 8, 0.4).catch((err) => {
        console.error('[chat] retrieveChunks failed:', err);
        return [];
      }),
    ]);

    const vault = vaultRes.data;
    const vaultName = vault?.name || 'Vault';
    const vaultDescription = vault?.description || '';
    const vaultCreatedAt = vault?.created_at ? new Date(vault.created_at).toLocaleDateString() : '';

    // Build vault info text (skip owner fetch to save time — use member list instead)
    const vaultInfoParts: string[] = [`Name: ${vaultName}`];
    if (vaultDescription) vaultInfoParts.push(`Description: ${vaultDescription}`);
    if (vaultCreatedAt) vaultInfoParts.push(`Created: ${vaultCreatedAt}`);

    // Count content in parallel
    const [{ count: srcCount }, { count: fileCount }] = await Promise.all([
      supabase.from('sources').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('files').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
    ]);
    vaultInfoParts.push(`Contains: ${srcCount || 0} sources, ${fileCount || 0} files`);
    const vaultInfoText = vaultInfoParts.join('\n');

    // Build members text from the parallel-fetched members
    const members = membersRes.data || [];
    let membersText = '';
    if (members.length > 0) {
      // Batch fetch member details in parallel
      const memberDetails = await Promise.all(
        members.map(async (m) => {
          try {
            const { data: { user: u } } = await supabase.auth.admin.getUserById(m.user_id);
            const name = u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email?.split('@')[0] || 'Unknown';
            const email = u?.email || '';
            return { name, email, role: m.role, joined_at: m.joined_at };
          } catch {
            return { name: 'Unknown', email: '', role: m.role, joined_at: m.joined_at };
          }
        })
      );
      membersText = memberDetails
        .map((m) => `- ${m.name}${m.email ? ` (${m.email})` : ''} — Role: ${m.role}${m.joined_at ? `, Joined: ${new Date(m.joined_at).toLocaleDateString()}` : ''}`)
        .join('\n');
    }

    // 4. Get or create conversation
    let convId = convRes.data?.id || null;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('chat_conversations')
        .insert({ vault_id: vaultId, user_id: user.id, title: question.slice(0, 100) })
        .select('id')
        .single();
      convId = newConv?.id;
    }

    // 5. Save user message + load history in parallel
    const [, historyRes] = await Promise.all([
      convId
        ? supabase.from('chat_messages').insert({ conversation_id: convId, role: 'user', content: question })
        : Promise.resolve(null),
      convId
        ? supabase.from('chat_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true }).limit(20)
        : Promise.resolve({ data: [] }),
    ]);

    const history = (historyRes?.data || []) as ChatMessage[];

    // 6. Format context from pre-fetched chunks
    const { contextText, citations } = formatContext(chunksResult);

    // Small delay after embedding call to avoid back-to-back rate limits
    if (chunksResult.length > 0) {
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 8. Build prompt
    const systemPrompt = buildSystemPrompt(vaultName, contextText, membersText, vaultInfoText);
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

    // Try each model — smart rate-limit handling
    // Round 1: try each model once (no delays)
    // Round 2: if all 429'd, wait 15s then try each model once more
    let geminiResponse: Response | null = null;
    let usedModel = '';

    async function tryModel(modelName: string): Promise<Response | null> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;

      // Disable thinking for gemini-2.5-* models to avoid delays
      const body = modelName.startsWith('gemini-2.5')
        ? { ...requestBody, generationConfig: { ...requestBody.generationConfig, thinkingConfig: { thinkingBudget: 0 } } }
        : requestBody;

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return resp;
      } catch (err) {
        console.error(`[chat] Fetch error for ${modelName}:`, err);
        return null;
      }
    }

    for (let round = 0; round < 2; round++) {
      if (round === 1) {
        console.log('[chat] All models rate-limited. Waiting 15s before retry...');
        await new Promise((r) => setTimeout(r, 15000));
      }

      for (const modelName of LLM_MODELS) {
        const resp = await tryModel(modelName);
        if (!resp) continue;

        if (resp.ok) {
          geminiResponse = resp;
          usedModel = modelName;
          break;
        }

        const status = resp.status;
        if (status === 404) {
          console.warn(`[chat] Model ${modelName} not found, skipping`);
          continue;
        }
        if (status === 429) {
          const errBody = await resp.text().catch(() => '');
          const isQuotaExhausted = errBody.includes('exceeded your current quota');
          if (isQuotaExhausted) {
            console.warn(`[chat] Quota exhausted on ${modelName}`);
            // All models share the same key/quota — skip remaining models too
            geminiResponse = null;
            usedModel = '';
            // Break out of both loops
            return NextResponse.json(
              { error: 'Gemini API daily quota exhausted. Please wait a few hours or use a new API key.' },
              { status: 429 }
            );
          }
          console.warn(`[chat] 429 from ${modelName} (round ${round + 1})`);
          continue; // try next model immediately
        }
        // Other error
        const errText = await resp.text().catch(() => '');
        console.error(`[chat] ${modelName}: ${status} ${errText.slice(0, 200)}`);
        continue;
      }

      if (geminiResponse) break;
    }

    if (!geminiResponse) {
      return NextResponse.json(
        { error: 'Gemini API is rate-limited. Please wait 30 seconds and try again.' },
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
