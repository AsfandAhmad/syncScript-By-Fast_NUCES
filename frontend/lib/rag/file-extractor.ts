/**
 * File content extractor for RAG indexing.
 * Downloads files from Supabase Storage and extracts text content.
 * Also handles seeded/placeholder files by generating rich descriptions.
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
 * Check if a file_url is a real Supabase Storage path vs a placeholder/seed URL.
 * Real storage paths look like: {vaultId}/docs/{timestamp}-{filename}
 * Seed URLs look like: https://storage.supabase.co/vault1/file.pdf
 */
function isStoragePath(fileUrl: string): boolean {
  return !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://');
}

/**
 * Try to download a file from Supabase Storage.
 * Returns the Blob on success, or null on failure.
 */
async function downloadFromStorage(fileUrl: string): Promise<Blob | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(fileUrl);

    if (error || !data) {
      console.error(`[file-extractor] Storage download error:`, error?.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`[file-extractor] Storage download exception:`, err);
    return null;
  }
}

/**
 * Extract text content from a file stored in Supabase Storage.
 * Falls back to generating rich description from filename when download fails.
 */
export async function extractFileContent(
  fileUrl: string,
  fileName: string,
  fileSize?: number | null
): Promise<string> {
  // Check file size limit
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return generateFileDescription(fileName, fileSize);
  }

  const ext = getExtension(fileName);

  // Only attempt Storage download if it's a real storage path (not a seed URL)
  if (isStoragePath(fileUrl)) {
    // For text-based files, download and read content
    if (TEXT_EXTENSIONS.has(ext)) {
      const blob = await downloadFromStorage(fileUrl);
      if (blob) {
        try {
          const text = await blob.text();
          if (text && text.trim().length > 0) {
            return `File: ${fileName}\n\n${text.trim()}`;
          }
        } catch { /* fall through to description */ }
      }
    }

    // For PDFs
    if (ext === '.pdf') {
      const blob = await downloadFromStorage(fileUrl);
      if (blob) {
        try {
          const buffer = await blob.arrayBuffer();
          const text = extractTextFromPdfBuffer(buffer);
          if (text && text.trim().length > 50) {
            return `File: ${fileName} (PDF)\n\n${text.trim()}`;
          }
        } catch { /* fall through */ }
      }
    }

    // For DOCX
    if (ext === '.docx') {
      const blob = await downloadFromStorage(fileUrl);
      if (blob) {
        try {
          const buffer = await blob.arrayBuffer();
          const text = extractTextFromDocx(buffer);
          if (text && text.trim().length > 10) {
            return `File: ${fileName} (DOCX)\n\n${text.trim()}`;
          }
        } catch { /* fall through */ }
      }
    }
  }

  // If we get here, either:
  // - file_url is a seed/placeholder URL (not in Storage)
  // - download failed
  // - unsupported format
  // Generate a rich description based on filename and metadata
  return generateFileDescription(fileName, fileSize);
}

/**
 * Generate a rich, useful description of a file from its name and metadata.
 * This ensures the RAG system has meaningful content even for files
 * that can't be downloaded (e.g., seed data, deleted files, binary files).
 */
function generateFileDescription(fileName: string, fileSize?: number | null): string {
  const ext = getExtension(fileName);
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const humanName = baseName
    .replace(/[-_]/g, ' ')
    .replace(/(\d{4})[- ](\d{2})[- ](\d{2})/, (_, y, m, d) => {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      return `${months[parseInt(m) - 1] || m} ${parseInt(d)}, ${y}`;
    })
    .replace(/\b(v\d+)/gi, 'version $1')
    .trim();

  const parts: string[] = [];
  parts.push(`File: ${fileName}`);
  parts.push(`Name: ${humanName}`);
  parts.push(`Type: ${getFileTypeDescription(ext)}`);
  if (fileSize) parts.push(`Size: ${formatSize(fileSize)}`);

  // Generate contextual content based on filename patterns
  const contextContent = inferContentFromName(baseName, ext);
  if (contextContent) {
    parts.push('');
    parts.push(contextContent);
  }

  return parts.join('\n');
}

/**
 * Infer likely content description from filename patterns.
 */
function inferContentFromName(baseName: string, ext: string): string {
  const lower = baseName.toLowerCase().replace(/[-_]/g, ' ');

  // Meeting notes
  if (lower.includes('meeting') || lower.includes('minutes')) {
    const dateMatch = baseName.match(/(\d{4})[- _](\d{2})[- _](\d{2})/);
    const dateStr = dateMatch ? `dated ${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';
    return `This is a meeting notes document ${dateStr}. It contains notes, discussions, decisions, and action items from a team meeting. Meeting notes typically include attendees, agenda items, key discussion points, decisions made, and follow-up tasks assigned to team members.`;
  }

  // API documentation
  if (lower.includes('api') && (lower.includes('doc') || lower.includes('reference'))) {
    return `This is an API documentation file. It contains endpoint definitions, request/response schemas, authentication details, and usage examples for the project's API. API docs typically cover REST endpoints, parameters, response codes, and integration guides.`;
  }

  // Strategy / business
  if (lower.includes('strategy') || lower.includes('roadmap') || lower.includes('plan')) {
    return `This is a strategy or planning document. It outlines strategic goals, initiatives, timelines, and key performance indicators. Strategy documents typically cover objectives, target outcomes, resource allocation, and milestone planning.`;
  }

  // Financial
  if (lower.includes('financial') || lower.includes('budget') || lower.includes('report')) {
    return `This is a financial or business report document. It contains data analysis, financial metrics, projections, and business performance summaries.`;
  }

  // Design / UI
  if (lower.includes('design') || lower.includes('ui') || lower.includes('assets') || lower.includes('mockup')) {
    return `This is a design/UI assets file. It contains user interface design elements, visual assets, and design system components used in the project.`;
  }

  // Architecture
  if (lower.includes('architecture') || lower.includes('diagram') || lower.includes('system')) {
    return `This is a system architecture document. It describes the technical architecture, system components, data flow, infrastructure setup, and technology decisions.`;
  }

  // Research / paper
  if (lower.includes('research') || lower.includes('paper') || lower.includes('study')) {
    return `This is a research paper or academic document. It contains research findings, methodology, analysis, literature review, and conclusions from a study.`;
  }

  // Notes
  if (lower.includes('notes') || lower.includes('summary')) {
    return `This is a notes/summary document. It contains captured notes, key takeaways, and summaries of important topics or discussions.`;
  }

  // Cheatsheet / reference
  if (lower.includes('cheatsheet') || lower.includes('cheat sheet') || lower.includes('reference') || lower.includes('guide')) {
    return `This is a reference guide or cheatsheet. It contains quick-reference material, commonly used patterns, syntax examples, and best practices.`;
  }

  // Specs / requirements
  if (lower.includes('spec') || lower.includes('requirement') || lower.includes('prd')) {
    return `This is a specification or requirements document. It defines project requirements, functional specifications, acceptance criteria, and technical constraints.`;
  }

  // Code files
  if (['.js','.ts','.py','.java','.c','.cpp','.go','.rs'].includes(ext)) {
    return `This is a source code file. It contains programming code, functions, classes, and implementation logic.`;
  }

  // Generic with file type hint
  const typeDesc = getFileTypeDescription(ext);
  return `This is a ${typeDesc.toLowerCase()} uploaded to the vault for team collaboration and reference.`;
}

/**
 * Get a human-readable file type description from extension.
 */
function getFileTypeDescription(ext: string): string {
  const typeMap: Record<string, string> = {
    '.pdf': 'PDF document',
    '.docx': 'Microsoft Word document',
    '.doc': 'Microsoft Word document',
    '.xlsx': 'Microsoft Excel spreadsheet',
    '.xls': 'Microsoft Excel spreadsheet',
    '.pptx': 'Microsoft PowerPoint presentation',
    '.ppt': 'Microsoft PowerPoint presentation',
    '.md': 'Markdown document',
    '.txt': 'Plain text document',
    '.csv': 'CSV data file',
    '.json': 'JSON data file',
    '.xml': 'XML document',
    '.html': 'HTML web page',
    '.png': 'PNG image',
    '.jpg': 'JPEG image',
    '.jpeg': 'JPEG image',
    '.gif': 'GIF image',
    '.svg': 'SVG vector image',
    '.zip': 'ZIP archive',
    '.tar': 'TAR archive',
    '.gz': 'Compressed archive',
    '.py': 'Python source file',
    '.js': 'JavaScript source file',
    '.ts': 'TypeScript source file',
    '.java': 'Java source file',
    '.sql': 'SQL database script',
    '.yaml': 'YAML configuration file',
    '.yml': 'YAML configuration file',
  };

  return typeMap[ext] || `${ext.replace('.', '').toUpperCase()} file`;
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
