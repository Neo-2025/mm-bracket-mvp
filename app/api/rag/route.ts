import { createClient } from '@supabase/supabase-js'
import { createPerplexity } from '@ai-sdk/perplexity'
import { streamText } from 'ai'
import { StreamingTextResponse } from 'ai/streaming' // Verified import path
import { generateEmbedding } from '@/lib/embeddings'

export const runtime = 'edge'

// Initialize clients outside handler for better performance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service role key
)

const perplexity = createPerplexity({
  apiKey: process.env.PERPLEXITY_API_KEY!,
  baseURL: 'https://api.perplexity.ai'
})

export async function POST(req: Request) {
  try {
    const { query, userId } = await req.json()
    
    // Validate input
    if (!query || !userId) {
      return new Response('Missing query or userId', { status: 400 })
    }

    // Generate embedding
    const embedding = await generateEmbedding(query)
    
    // Vector search with RLS
    const { data: context, error } = await supabase.rpc('match_faqs', {
      query_embedding: embedding,
      match_threshold: 0.7,
      user_id: userId
    }).select('content')

    if (error) throw new Error(`Supabase error: ${error.message}`)
    if (!context?.length) return new Response('No relevant context', { status: 404 })

    // Stream response with context
    const stream = await streamText({
      model: perplexity('llama-3-sonar-large-32k'),
      system: `Answer using ONLY this context: ${JSON.stringify(context)}. If unsure, say "I don't know".`,
      messages: [{ role: 'user', content: query }]
    })

    return new StreamingTextResponse(stream)
    
  } catch (error) {
    console.error('RAG Error:', error)
    return new Response(error instanceof Error ? error.message : 'Internal error', { 
      status: 500 
    })
  }
}

export const config = {
  runtime: 'edge',
  unstable_allowDynamic: '/lib/embeddings.ts'
}
