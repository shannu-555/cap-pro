import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces for embedding
function chunkText(text: string, maxChunkSize: number = 500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Generate embeddings using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { queryId, action } = await req.json();

    if (action === 'process') {
      console.log('Processing RAG for query:', queryId);

      // Fetch all agent data for this query
      const [sentimentData, competitorData, trendData] = await Promise.all([
        supabase.from('sentiment_analysis').select('*').eq('query_id', queryId),
        supabase.from('competitor_data').select('*').eq('query_id', queryId),
        supabase.from('trend_data').select('*').eq('query_id', queryId)
      ]);

      // Combine all data into text chunks
      const allText: string[] = [];

      // Add sentiment data
      sentimentData.data?.forEach(s => {
        allText.push(`Sentiment from ${s.source}: ${s.sentiment} (${s.confidence} confidence). Content: ${s.content}. Topics: ${s.topics?.join(', ')}`);
      });

      // Add competitor data
      competitorData.data?.forEach(c => {
        allText.push(`Competitor ${c.competitor_name}: Price $${c.price}, Rating ${c.rating}. Features: ${c.features?.join(', ')}. URL: ${c.url}`);
      });

      // Add trend data
      trendData.data?.forEach(t => {
        allText.push(`Trend keyword "${t.keyword}": ${t.search_volume} searches, ${t.trend_direction} trend over ${t.time_period}.`);
      });

      // Chunk and embed all text
      const allChunks: string[] = [];
      allText.forEach(text => {
        allChunks.push(...chunkText(text));
      });

      console.log(`Processing ${allChunks.length} chunks for embeddings`);

      // Generate embeddings and store
      for (const chunk of allChunks) {
        const embedding = await generateEmbedding(chunk);
        
        await supabase
          .from('research_chunks')
          .insert({
            query_id: queryId,
            content: chunk,
            embedding: JSON.stringify(embedding),
            metadata: { processed_at: new Date().toISOString() }
          });
      }

      console.log('RAG processing completed for query:', queryId);

      return new Response(JSON.stringify({ 
        success: true, 
        chunks_processed: allChunks.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'search') {
      const { query, limit = 5 } = await req.json();
      console.log('Searching chunks for:', query);

      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query);

      // Search for similar chunks using pgvector
      const { data, error } = await supabase.rpc('search_research_chunks', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: 0.7,
        match_count: limit
      });

      if (error) {
        console.error('Vector search error:', error);
        throw error;
      }

      return new Response(JSON.stringify({ 
        success: true, 
        chunks: data || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in rag-processor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
