import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message, userId } = await req.json();
    console.log('OpenAI assistant processing:', message, userId);

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Enhance the prompt with real market research context
    let realDataContext = '';
    
    try {
      // Get recent competitor data for context
      const { data: competitorData } = await supabase
        .from('competitor_data')
        .select(`
          competitor_name,
          price,
          rating,
          features,
          research_queries!inner(query_text)
        `)
        .limit(5);

      if (competitorData && competitorData.length > 0) {
        realDataContext += `\n\nRecent Competitor Data:\n${competitorData.map(c => 
          `• ${c.competitor_name}: $${c.price || 'N/A'}, Rating: ${c.rating || 'N/A'}/5`
        ).join('\n')}`;
      }

      // Get recent sentiment data for context
      const { data: sentimentData } = await supabase
        .from('sentiment_analysis')
        .select(`
          sentiment,
          confidence,
          source,
          research_queries!inner(query_text)
        `)
        .limit(5);

      if (sentimentData && sentimentData.length > 0) {
        const avgSentiment = sentimentData.reduce((acc, s) => acc + s.confidence, 0) / sentimentData.length;
        realDataContext += `\n\nRecent Sentiment Analysis:\n• Average confidence: ${avgSentiment.toFixed(1)}%\n• Sources: ${sentimentData.map(s => s.source).join(', ')}`;
      }

      // Get trend data for context
      const { data: trendData } = await supabase
        .from('trend_data')
        .select(`
          keyword,
          search_volume,
          trend_direction,
          research_queries!inner(query_text)
        `)
        .limit(5);

      if (trendData && trendData.length > 0) {
        realDataContext += `\n\nRecent Trend Data:\n${trendData.map(t => 
          `• ${t.keyword}: ${t.search_volume || 'N/A'} searches, trending ${t.trend_direction || 'stable'}`
        ).join('\n')}`;
      }
    } catch (error) {
      console.error('Error fetching context data:', error);
    }

    const enhancedPrompt = `
You are an expert AI Market Research Assistant. You help users analyze market data, competitors, and trends with real, data-driven insights.

Key capabilities:
- Sentiment Analysis: Track customer opinions and emotions across platforms
- Competitor Monitoring: Real-time price tracking, feature comparisons, market positioning
- Trend Detection: Emerging patterns, search volume analysis, market shifts
- Insight Generation: Actionable recommendations based on data analysis
- Report Generation: Comprehensive PDF reports with charts and references

${realDataContext}

User message: ${message}

Provide a helpful, conversational response that:
1. Uses the real data context when available
2. Provides specific, actionable insights
3. Suggests concrete next steps for market research
4. Mentions relevant features when appropriate
5. Keeps responses concise but informative (2-3 sentences unless details requested)

If asking about specific products, provide real product names and variants when possible.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: enhancedPrompt }
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || 
      "I'm here to help with your market research needs. What would you like to analyze today?";

    console.log('OpenAI response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      response: generatedText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in openai-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: "I'm here to help with market research analysis. What specific product or company would you like me to research?"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});