/**
 * File content extractor for RAG indexing.
 * Downloads files from Supabase Storage and extracts text content.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';

const STORAGE_BUCKET = 'vault-files';

// Max file size to process (5MB) — skip very large files
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Text-based file extensions we can extract content from
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.html', '.htm',
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h',
  '.css', '.scss', '.less', '.yaml', '.yml', '.toml', '.ini', '.cfg',
  '.sh', '.bash', '.zsh', '.bat', '.ps1', '.sql', '.r', '.rb', '.go',
  '.rs', '.swift', '.kt', '.scala', '.lua', '.pl', '.php', '.tex',
  '.bib', '.log', '.env', '.gitignore', '.dockerfile',
]);

/**
 * Extract text content from a file stored in Supabase Storage.
 * Returns the text content, or a fallback description for binary files.
 */
export async function extractFileContent(
  fileUrl: string,
  fileName: string,
  fileSize?: number | null
): Promise<string> {
  const supabase = createServerSupabaseClient();

  // Check file size limit
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return `File: ${fileName} (${formatSize(fileSize)} — too large to index content)`;
  }

  const ext = getExtension(fileName);

  // For text-based files, download and read content
  if (TEXT_EXTENSIONS.has(ext)) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(fileUrl);

      if (error || !data) {
        console.error(`[file-extractor] Download error for ${fileName}:`, error?.message);
        return `File: ${fileName} (could not download content)`;
      }

      const text = await data.text();
      if (text && text.trim().length > 0) {
        // Prepend filename as context
        return `File: ${fileName}\n\n${text.trim()}`;
      }

      return `File: ${fileName} (empty file)`;
    } catch (err) {
      console.error(`[file-extractor] Error extracting ${fileName}:`, err);
      return `File: ${fileName} (extraction failed)`;
    }
  }

  // For PDFs — extract what we can from the raw bytes (basic text extraction)
  if (ext === '.pdf') {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(fileUrl);

      if (error || !data) {
        return `File: ${fileName} (PDF — could not download)`;
      }

      const buffer = await data.arrayBuffer();
      const text = extractTextFromPdfBuffer(buffer);
      if (text && text.trim().length > 50) {
        return `File: ${fileName} (PDF)\n\n${text.trim()}`;
      }

      return `File: ${fileName} (PDF document — text extraction limited)`;
    } catch {
      return `File: ${fileName} (PDF document)`;
    }
  }

  // For DOCX — try basic extraction
  if (ext === '.docx') {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(fileUrl);

      if (error || !data) {
        return `File: ${fileName} (DOCX — could not download)`;
      }

      const buffer = await data.arrayBuffer();
      const text = extractTextFromDocx(buffer);
      if (text && text.trim().length > 10) {
        return `File: ${fileName} (DOCX)\n\n${text.trim()}`;
      }

      return `File: ${fileName} (Word document — text extraction limited)`;
    } catch {
      return `File: ${fileName} (Word document)`;
    }
  }

  // Binary/unknown files — just index the filename
  return `File: ${fileName} (${ext || 'binary'} file)`;
}

/**
 * Basic PDF text extraction — reads text strings from PDF binary.
 * This is a lightweight approach that extracts visible text without a full PDF parser.
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];

  // Look for text between BT (begin text) and ET (end text) markers
  // and extract parenthesized strings (PDF literal strings)
  let i = 0;
  let inText = false;

  while (i < bytes.length - 1) {
    // Detect "BT" marker
    if (bytes[i] === 0x42 && bytes[i + 1] === 0x54) {
      inText = true;
      i += 2;
      continue;
    }
    // Detect "ET" marker
    if (bytes[i] === 0x45 && bytes[i + 1] === 0x54) {
      inText = false;
      chunks.push(' ');
      i += 2;
      continue;
    }

    if (inText && bytes[i] === 0x28) {
      // Opening parenthesis — start of literal string
      i++;
      let str = '';
      let depth = 1;
      while (i < bytes.length && depth > 0) {
        if (bytes[i] === 0x28 && bytes[i - 1] !== 0x5C) depth++;
        else if (bytes[i] === 0x29 && bytes[i - 1] !== 0x5C) depth--;

        if (depth > 0) {
          const ch = bytes[i];
          if (ch >= 32 && ch < 127) {
            str += String.fromCharCode(ch);
          } else if (ch === 10 || ch === 13) {
            str += '\n';
          }
        }
        i++;
      }
      if (str.trim()) chunks.push(str);
      continue;
    }

    i++;
  }

  // Also try to extract text from stream objects (for text-based PDFs)
  const fullText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const streamRegex = /\(([^)]{2,})\)/g;
  let match;
  const streamTexts: string[] = [];
  while ((match = streamRegex.exec(fullText)) !== null) {
    const t = match[1].replace(/\\[nrt]/g, ' ').trim();
    if (t.length > 2 && /[a-zA-Z]{2}/.test(t)) {
      streamTexts.push(t);
    }
  }

  const combined = chunks.join('').trim();
  const fromRegex = streamTexts.join(' ').trim();

  // Return whichever has more content
  return combined.length > fromRegex.length ? combined : fromRegex;
}

/**
 * Basic DOCX text extraction — DOCX is a ZIP containing XML.
 * Extracts text from word/document.xml without a full XML parser.
 */
function extractTextFromDocx(buffer: ArrayBuffer): string {
  // DOCX files are ZIP archives. We look for the XML content directly.
  const bytes = new Uint8Array(buffer);
  const fullText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  // Find text between <w:t> tags
  const textRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
  const parts: string[] = [];
  let match;
  while ((match = textRegex.exec(fullText)) !== null) {
    parts.push(match[1]);
  }

  if (parts.length > 0) {
    return parts.join(' ');
  }

  // Fallback: extract any readable text longer than 3 chars
  const readableRegex = /[A-Za-z][A-Za-z0-9\s,.;:!?'-]{10,}/g;
  const readable: string[] = [];
  while ((match = readableRegex.exec(fullText)) !== null) {
    readable.push(match[0].trim());
  }

  return readable.join('\n');
}

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
