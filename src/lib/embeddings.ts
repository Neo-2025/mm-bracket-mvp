// src/lib/embeddings.ts
import { createPerplexity } from '@ai-sdk/perplexity'

export async function generateEmbedding(text: string): Promise<number[]> {
  const perplexity = createPerplexity({
    apiKey: process.env.PERPLEXITY_API_KEY!
  })
  
  const { embedding } = await perplexity.embed({
    model: 'text-embedding-3-small',
    input: text
  })
  
  return embedding
}