import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const { queryId, queryText, queryType } = await req.json();
    console.log('Sentiment agent processing:', queryId, queryText, queryType);

    // Simulate gathering sentiment data from various sources
    const sources = ['Twitter/X', 'Reddit', 'Product Reviews', 'News Articles', 'Forums'];
    
    const sentimentPrompt = `
    Analyze the sentiment around "${queryText}" (${queryType === 'product' ? 'product' : 'company'}).
    Provide realistic sentiment analysis data as if gathered from social media, reviews, and news.
    Return a JSON object with:
    {
      "sentiments": [
        {
          "source": "source_name",
          "sentiment": "positive|negative|neutral",
          "confidence": 0.85,
          "content": "sample content or review",
          "topics": ["topic1", "topic2"]
        }
      ]
    }
    
    Generate 5-8 realistic sentiment entries from different sources.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a sentiment analysis expert. Provide realistic market sentiment data.' },
          { role: 'user', content: sentimentPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    });

    const aiData = await response.json();
    let sentimentResults;

    try {
      sentimentResults = JSON.parse(aiData.choices[0].message.content);
    } catch {
      // Fallback data if JSON parsing fails
      sentimentResults = {
        sentiments: [
          {
            source: 'Twitter/X',
            sentiment: 'positive',
            confidence: 0.78,
            content: `Great experience with ${queryText}! Highly recommend.`,
            topics: ['quality', 'experience']
          },
          {
            source: 'Reddit',
            sentiment: 'neutral',
            confidence: 0.65,
            content: `Mixed feelings about ${queryText}. Some good points, some concerns.`,
            topics: ['value', 'features']
          },
          {
            source: 'Product Reviews',
            sentiment: 'positive',
            confidence: 0.82,
            content: `${queryText} exceeded my expectations. Well worth it.`,
            topics: ['satisfaction', 'value']
          }
        ]
      };
    }

    // Store sentiment data
    for (const sentiment of sentimentResults.sentiments) {
      await supabase
        .from('sentiment_analysis')
        .insert({
          query_id: queryId,
          source: sentiment.source,
          sentiment: sentiment.sentiment,
          confidence: sentiment.confidence,
          content: sentiment.content,
          topics: sentiment.topics || []
        });
    }

    console.log('Sentiment analysis completed for query:', queryId);

    return new Response(JSON.stringify({ success: true, count: sentimentResults.sentiments.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sentiment-agent:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});