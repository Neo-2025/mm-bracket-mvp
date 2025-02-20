import { createClient } from '@supabase/supabase-js'
import { createPerplexity } from '@ai-sdk/perplexity'
import { streamText, StreamingTextResponse } from 'ai' // Single import
import { generateEmbedding } from '@/lib/embeddings'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const perplexity = createPerplexity({
  apiKey: process.env.PERPLEXITY_API_KEY!,
  baseURL: 'https://api.perplexity.ai'
})

export async function POST(req: Request) {
  try {
    const { query, userId } = await req.json()
    
    if (!query || !userId) {
      return new Response('Missing query/userId', { status: 400 })
    }

    const embedding = await generateEmbedding(query)
    
    const { data: context, error } = await supabase.rpc('match_faqs', {
      query_embedding: embedding,
      match_threshold: 0.7,
      user_id: userId
    }).select('content')

    if (error) throw error
    if (!context?.length) return new Response('No context', { status: 404 })

    const stream = await streamText({
      model: perplexity('llama-3-sonar-large-32k'),
      system: `Context: ${JSON.stringify(context)}\nAnswer using only this.`,
      messages: [{ role: 'user', content: query }]
    })

    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('RAG Error:', error)
    return new Response('Server Error', { status: 500 })
  }
}