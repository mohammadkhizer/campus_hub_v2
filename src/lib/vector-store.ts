import { ai } from '@/ai/genkit';
import dbConnect from './mongoose';
import mongoose from 'mongoose';

/**
 * Interface for Vector Search Results
 */
export interface SearchResult {
  content: string;
  score: number;
  metadata: {
    sourceId: string;
    sourceTitle: string;
    page?: number;
  };
}

/**
 * Generate embeddings for a given text chunk
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await ai.embed({
    embedder: 'googleai/text-embedding-004',
    content: text,
  });
  // Genkit returns an array of documents with embeddings
  return result[0].embedding;
}

/**
 * Perform a vector search on a MongoDB collection
 * Note: Requires a Search Index named 'default' on the collection with 'vector' field
 */
export async function queryVectorStore(
  collectionName: string,
  query: string,
  filter: Record<string, any> = {},
  limit: number = 5
): Promise<SearchResult[]> {
  await dbConnect();
  
  const queryVector = await generateEmbedding(query);
  const collection = mongoose.connection.db!.collection(collectionName);

  const pipeline = [
    {
      $vectorSearch: {
        index: 'default',
        path: 'embedding',
        queryVector: queryVector,
        numCandidates: 100,
        limit: limit,
        filter: filter,
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  const results = await collection.aggregate(pipeline).toArray();
  
  return results.map((doc: any) => ({
    content: doc.content,
    score: doc.score,
    metadata: doc.metadata,
  }));
}

/**
 * Helper to chunk text (Basic implementation)
 */
export function chunkText(text: string, size: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }
  
  return chunks;
}
