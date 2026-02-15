/**
 * Gemini embedding wrapper for RAG pipeline.
 * Uses text-embedding-004 (768 dimensions).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const EMBEDDING_MODEL = 'text-embedding-004';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate an embedding vector for a single text string.
 * Returns a 768-dimensional float array.
 */
export async function embedText(text: string): Promise<number[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts in batch.
 * Gemini supports batch embedding natively.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const result = await model.batchEmbedContents({
    requests: texts.map((text) => ({
      content: { role: 'user', parts: [{ text }] },
    })),
  });

  return result.embeddings.map((e) => e.values);
}
