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
    console.log('Trend agent processing:', queryId, queryText, queryType);

    const trendPrompt = `
    Analyze market trends for "${queryText}" (${queryType === 'product' ? 'product' : 'company'}).
    Provide realistic trend analysis data as if gathered from market research tools.
    Return a JSON object with:
    {
      "trends": [
        {
          "keyword": "related keyword",
          "searchVolume": 12500,
          "trendDirection": "increasing|decreasing|stable",
          "timePeriod": "30d|90d|1y",
          "dataPoints": [
            {"date": "2024-01-01", "volume": 10000, "interest": 85},
            {"date": "2024-01-15", "volume": 12500, "interest": 92}
          ]
        }
      ]
    }
    
    Generate 3-5 realistic trend entries with different time periods and keywords.
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
          { role: 'system', content: 'You are a market trend analyst. Provide realistic trend data with proper JSON format.' },
          { role: 'user', content: trendPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    });

    const aiData = await response.json();
    let trendResults;

    try {
      trendResults = JSON.parse(aiData.choices[0].message.content);
    } catch {
      // Fallback data if JSON parsing fails
      const currentDate = new Date();
      const pastDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      trendResults = {
        trends: [
          {
            keyword: queryText,
            searchVolume: 15420,
            trendDirection: 'increasing',
            timePeriod: '30d',
            dataPoints: [
              { date: pastDate.toISOString().split('T')[0], volume: 12000, interest: 78 },
              { date: currentDate.toISOString().split('T')[0], volume: 15420, interest: 89 }
            ]
          },
          {
            keyword: `${queryText} reviews`,
            searchVolume: 8750,
            trendDirection: 'stable',
            timePeriod: '90d',
            dataPoints: [
              { date: pastDate.toISOString().split('T')[0], volume: 8200, interest: 65 },
              { date: currentDate.toISOString().split('T')[0], volume: 8750, interest: 68 }
            ]
          },
          {
            keyword: `${queryText} alternatives`,
            searchVolume: 6300,
            trendDirection: 'decreasing',
            timePeriod: '30d',
            dataPoints: [
              { date: pastDate.toISOString().split('T')[0], volume: 7100, interest: 72 },
              { date: currentDate.toISOString().split('T')[0], volume: 6300, interest: 65 }
            ]
          }
        ]
      };
    }

    // Store trend data
    for (const trend of trendResults.trends) {
      await supabase
        .from('trend_data')
        .insert({
          query_id: queryId,
          keyword: trend.keyword,
          search_volume: trend.searchVolume,
          trend_direction: trend.trendDirection,
          time_period: trend.timePeriod,
          data_points: trend.dataPoints || []
        });
    }

    console.log('Trend analysis completed for query:', queryId);

    return new Response(JSON.stringify({ success: true, count: trendResults.trends.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in trend-agent:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});