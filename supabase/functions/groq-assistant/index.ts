import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const groqApiKey = Deno.env.get('GROQ_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, queryId } = await req.json();
    console.log('Processing assistant request:', message, 'for query:', queryId);

    if (!groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let contextData = '';
    let agentSummary = '';
    let ragChunks = '';

    // If queryId provided, fetch relevant agent data for context
    if (queryId) {
      console.log('Fetching agent data and RAG chunks for context...');
      
      const [sentimentRes, competitorRes, trendRes, reportRes, chunksRes] = await Promise.allSettled([
        supabase.from('sentiment_analysis').select('*').eq('query_id', queryId).limit(5),
        supabase.from('competitor_data').select('*').eq('query_id', queryId).limit(5),
        supabase.from('trend_data').select('*').eq('query_id', queryId).limit(5),
        supabase.from('research_reports').select('*').eq('query_id', queryId).single(),
        supabase.from('research_chunks').select('content').eq('query_id', queryId).limit(5)
      ]);

      // Build context from agent data
      const sentimentData = sentimentRes.status === 'fulfilled' && sentimentRes.value.data || [];
      const competitorData = competitorRes.status === 'fulfilled' && competitorRes.value.data || [];
      const trendData = trendRes.status === 'fulfilled' && trendRes.value.data || [];
      const reportData = reportRes.status === 'fulfilled' && reportRes.value.data || null;
      const chunksData = chunksRes.status === 'fulfilled' && chunksRes.value.data || [];

      // Add RAG chunks if available
      if (chunksData.length > 0) {
        ragChunks = `\n\nRETRIEVED KNOWLEDGE:\n${chunksData.map(c => c.content).join('\n\n')}\n`;
      }

      // Create comprehensive context
      if (sentimentData.length > 0) {
        const avgSentiment = sentimentData.reduce((acc, item) => acc + item.confidence, 0) / sentimentData.length;
        contextData += `\n\nSENTIMENT ANALYSIS:\n`;
        contextData += `Average sentiment confidence: ${(avgSentiment * 100).toFixed(1)}%\n`;
        contextData += `Recent sentiment data: ${sentimentData.slice(0, 3).map(s => `${s.sentiment} (${s.source})`).join(', ')}\n`;
      }

      if (competitorData.length > 0) {
        contextData += `\n\nCOMPETITOR ANALYSIS:\n`;
        contextData += competitorData.slice(0, 3).map(c => 
          `${c.competitor_name}: $${c.price || 'N/A'}, Rating: ${c.rating || 'N/A'}/5`
        ).join('\n') + '\n';
      }

      if (trendData.length > 0) {
        contextData += `\n\nTREND ANALYSIS:\n`;
        contextData += trendData.slice(0, 3).map(t => 
          `${t.keyword}: ${t.search_volume || 'N/A'} searches, trending ${t.trend_direction || 'neutral'}`
        ).join('\n') + '\n';
      }

      if (reportData && reportData.insights) {
        contextData += `\n\nKEY INSIGHTS:\n`;
        if (Array.isArray(reportData.insights)) {
          contextData += reportData.insights.slice(0, 3).join('\n') + '\n';
        }
      }

      // Generate agent summary
      agentSummary = `Based on AI agent analysis: ${sentimentData.length} sentiment points, ${competitorData.length} competitors tracked, ${trendData.length} trend indicators processed.`;
    }

    // Construct the prompt for Groq with RAG context
    const systemPrompt = `You are an expert AI Market Research Assistant with access to real-time market intelligence. Your role is to provide actionable, data-driven insights for business decision-making.

CAPABILITIES:
- Analyze market sentiment from multiple sources
- Track competitor pricing, features, and positioning
- Identify emerging market trends and opportunities
- Generate strategic recommendations based on data

CONTEXT DATA FROM AI AGENTS:${contextData}

${ragChunks}

${agentSummary}

INSTRUCTIONS:
- Always provide specific, actionable insights
- Reference actual data points when available
- Be concise but comprehensive in your analysis
- Focus on business implications and opportunities
- If no specific data is available, provide general market research guidance
- Maintain a professional, analytical tone
- Use the retrieved knowledge and agent data to provide accurate, contextual responses`;

    const userPrompt = `User Question: ${message}

Please provide a detailed, data-driven response based on the available market intelligence and retrieved context.`;

    console.log('Calling Groq API...');

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Fast and capable model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        stream: false
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error('Groq API error:', errorData);
      throw new Error(`Groq API failed: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    console.log('Groq API response received');

    if (!groqData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Groq API');
    }

    const assistantResponse = groqData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: assistantResponse,
      hasContext: !!contextData,
      hasRAGChunks: !!ragChunks,
      agentDataUsed: {
        sentiment: sentimentData?.length || 0,
        competitors: competitorData?.length || 0,
        trends: trendData?.length || 0,
        insights: reportData ? 1 : 0,
        rag_chunks: chunksData?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in groq-assistant:', error);
    
    // Provide intelligent fallback response
    const fallbackResponse = `I apologize, but I'm currently unable to access the full market intelligence data. However, I can still help with general market research guidance:

For your query "${req.json().then(data => data.message).catch(() => 'your question')}", here are some general recommendations:

1. **Market Analysis Framework**: Consider analyzing competitor positioning, pricing strategies, and customer sentiment across multiple channels.

2. **Data Collection**: Gather information from social media, review platforms, industry reports, and direct customer feedback.

3. **Trend Monitoring**: Track search volumes, social mentions, and industry publications for emerging patterns.

4. **Competitive Intelligence**: Monitor competitor product launches, pricing changes, and marketing campaigns.

Please try again in a moment, or provide more specific details about what you'd like to research.`;

    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      hasContext: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});