import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { embedTexts } from '@/lib/rag/embeddings';
import { chunkSource, chunkAnnotation, chunkFile } from '@/lib/rag/chunker';

/**
 * POST /api/embeddings — Index or delete document chunks for RAG.
 *
 * Body: {
 *   vaultId: string,
 *   sourceType: 'source' | 'annotation' | 'file',
 *   sourceId: string,
 *   action: 'upsert' | 'delete'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) return unauthorizedResponse(authError || undefined);

    const { vaultId, sourceType, sourceId, action } = await request.json();

    if (!vaultId || !sourceType || !sourceId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // DELETE: remove all chunks for this source
    if (action === 'delete') {
      const { error } = await supabase
        .from('document_chunks')
        .delete()
        .eq('vault_id', vaultId)
        .eq('source_type', sourceType)
        .eq('source_id', sourceId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, chunksProcessed: 0 });
    }

    // UPSERT: fetch content, chunk, embed, insert
    let chunks: { content: string; index: number; metadata: Record<string, any> }[] = [];

    if (sourceType === 'source') {
      const { data: source } = await supabase
        .from('sources')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (!source) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }

      chunks = chunkSource(source);
    } else if (sourceType === 'annotation') {
      const { data: annotation } = await supabase
        .from('annotations')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (!annotation) {
        return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
      }

      // Get parent source title
      const { data: parentSource } = await supabase
        .from('sources')
        .select('title')
        .eq('id', annotation.source_id)
        .single();

      chunks = chunkAnnotation(annotation, parentSource?.title);
    } else if (sourceType === 'file') {
      const { data: file } = await supabase
        .from('files')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      // For now, index just the file name & metadata
      // Full text extraction from PDFs would be a future enhancement
      const textContent = `File: ${file.file_name}\nSize: ${file.file_size} bytes`;
      chunks = chunkFile(file, textContent);
    }

    if (chunks.length === 0) {
      return NextResponse.json({ success: true, chunksProcessed: 0 });
    }

    // Generate embeddings for all chunks
    const texts = chunks.map((c) => c.content);
    const embeddings = await embedTexts(texts);

    // Delete existing chunks for this source, then insert new ones
    await supabase
      .from('document_chunks')
      .delete()
      .eq('vault_id', vaultId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId);

    const rows = chunks.map((chunk, i) => ({
      vault_id: vaultId,
      source_type: sourceType,
      source_id: sourceId,
      chunk_index: chunk.index,
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(rows);

    if (insertError) {
      console.error('[embeddings] Insert error:', insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chunksProcessed: chunks.length });
  } catch (err) {
    console.error('[embeddings] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
