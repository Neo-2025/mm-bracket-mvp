import { createClient } from '@supabase/supabase-js'
import { createPerplexity } from '@ai-sdk/perplexity'
import { streamText, StreamingTextResponse } from 'ai' // Added missing import
import { generateEmbedding } from '@/lib/embeddings'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Changed to match common Supabase naming
)

export async function POST(req: Request) {
  try {
    const { query, userId } = await req.json()
    
    // Generate embedding using updated SDK method
    const embedding = await generateEmbedding(query)
    
    // Vector search with error handling
    const { data: context, error } = await supabase.rpc('match_faqs', {
      query_embedding: embedding,
      match_threshold: 0.7,
      user_id: userId
    }).select('content')

    if (error) throw new Error(error.message)
    if (!context?.length) return new Response('No relevant context', { status: 404 })

    // Initialize Perplexity once (moved outside try block)
    const perplexity = createPerplexity({
      apiKey: process.env.PERPLEXITY_API_KEY!,
      baseURL: 'https://api.perplexity.ai'
    })

    // Proper streaming implementation
    const stream = await streamText({
      model: perplexity('llama-3-sonar-large-32k'),
      system: `Respond using ONLY this context: ${JSON.stringify(context)}`,
      messages: [{ role: 'user', content: query }]
    })

    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('RAG Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Config must be exported as named export
export const config = {
  runtime: 'edge',
  unstable_allowDynamic: '/lib/embeddings.ts'
}
