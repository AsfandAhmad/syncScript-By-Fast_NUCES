/**
 * Text chunking utility for RAG pipeline.
 * Splits text into overlapping chunks for embedding.
 */

const DEFAULT_CHUNK_SIZE = 1500;   // ~375 tokens
const DEFAULT_CHUNK_OVERLAP = 200; // ~50 tokens overlap

export interface Chunk {
  content: string;
  index: number;
  metadata: Record<string, any>;
}

/**
 * Split text into overlapping chunks by paragraph/sentence boundaries.
 */
export function chunkText(
  text: string,
  metadata: Record<string, any> = {},
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP
): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  const cleaned = text.replace(/\r\n/g, '\n').trim();

  // If text fits in one chunk, return it directly
  if (cleaned.length <= chunkSize) {
    return [{ content: cleaned, index: 0, metadata }];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // Try to break at paragraph boundary
    if (end < cleaned.length) {
      const paragraphBreak = cleaned.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + chunkSize * 0.3) {
        end = paragraphBreak + 2;
      } else {
        // Try sentence boundary
        const sentenceBreak = cleaned.lastIndexOf('. ', end);
        if (sentenceBreak > start + chunkSize * 0.3) {
          end = sentenceBreak + 2;
        }
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({ content: chunk, index, metadata });
      index++;
    }

    start = end - chunkOverlap;
    if (start >= cleaned.length) break;
  }

  return chunks;
}

/**
 * Create chunks from a Source record.
 */
export function chunkSource(source: {
  id: string;
  title?: string;
  url: string;
  metadata: Record<string, any>;
  created_by: string;
}): Chunk[] {
  // Build text from source metadata
  const parts: string[] = [];
  if (source.title) parts.push(`Title: ${source.title}`);
  parts.push(`URL: ${source.url}`);

  const meta = source.metadata || {};
  if (meta.description) parts.push(`Description: ${meta.description}`);
  if (meta.abstract) parts.push(`Abstract: ${meta.abstract}`);
  if (meta.authors) parts.push(`Authors: ${meta.authors}`);
  if (meta.journal) parts.push(`Journal: ${meta.journal}`);
  if (meta.year) parts.push(`Year: ${meta.year}`);
  if (meta.notes) parts.push(`Notes: ${meta.notes}`);

  const text = parts.join('\n');
  return chunkText(text, {
    source_type: 'source',
    source_id: source.id,
    title: source.title || source.url,
    url: source.url,
    created_by: source.created_by,
  });
}

/**
 * Create chunks from an Annotation record.
 */
export function chunkAnnotation(annotation: {
  id: string;
  source_id: string;
  content: string;
  created_by: string;
  author_name?: string;
  author_email?: string;
}, sourceTitle?: string): Chunk[] {
  const text = annotation.content;
  return chunkText(text, {
    source_type: 'annotation',
    source_id: annotation.id,
    parent_source_id: annotation.source_id,
    title: `Annotation on "${sourceTitle || 'source'}"`,
    author_name: annotation.author_name,
    author_email: annotation.author_email,
    created_by: annotation.created_by,
  });
}

/**
 * Create chunks from a File record (text content).
 */
export function chunkFile(file: {
  id: string;
  file_name: string;
  uploaded_by: string;
}, textContent: string): Chunk[] {
  return chunkText(textContent, {
    source_type: 'file',
    source_id: file.id,
    title: file.file_name,
    uploaded_by: file.uploaded_by,
  });
}
