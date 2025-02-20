import { createClient } from '@supabase/supabase-js'
import { createPerplexity } from '@ai-sdk/perplexity'
import { StreamingTextResponse } from 'ai'
import { generateEmbedding } from '@/lib/embeddings'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: Request) {
  const { query, userId } = await req.json()
  
  // Generate embedding for query
  const embedding = await generateEmbedding(query)
  
  // Vector similarity search
  const { data: context } = await supabase.rpc('match_faqs', {
    query_embedding: embedding,
    match_threshold: 0.7,
    user_id: userId
  }).select('content')

  if (!context?.length) {
    return new Response('No relevant context', { status: 404 })
  }

  // Perplexity AI configuration
  const perplexity = createPerplexity({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    baseURL: 'https://api.perplexity.ai'
  })

  // Stream response
  const stream = await perplexity('llama-3-sonar-large-32k').streamText({
    system: `Respond using ONLY this context: ${JSON.stringify(context)}`,
    messages: [{ role: 'user', content: query }]
  })

  return new StreamingTextResponse(stream)
}
export const config = {
    runtime: 'edge',
    // Bypass Vercel auth for this endpoint
    unstable_allowDynamic: '/lib/embeddings.ts'
  }