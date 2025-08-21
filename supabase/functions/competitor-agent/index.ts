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
    console.log('Competitor agent processing:', queryId, queryText, queryType);

    const competitorPrompt = `
    Analyze competitors for "${queryText}" (${queryType === 'product' ? 'product' : 'company'}).
    Provide realistic competitor analysis data as if gathered from market research.
    Return a JSON object with:
    {
      "competitors": [
        {
          "name": "Competitor Name",
          "price": 99.99,
          "rating": 4.2,
          "url": "https://example.com/product",
          "features": ["feature1", "feature2", "feature3"]
        }
      ]
    }
    
    Generate 4-6 realistic competitor entries with appropriate pricing and features.
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
          { role: 'system', content: 'You are a competitive intelligence expert. Provide realistic competitor data.' },
          { role: 'user', content: competitorPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    });

    const aiData = await response.json();
    let competitorResults;

    try {
      competitorResults = JSON.parse(aiData.choices[0].message.content);
    } catch {
      // Fallback data if JSON parsing fails
      competitorResults = {
        competitors: [
          {
            name: `${queryText} Alternative A`,
            price: 89.99,
            rating: 4.1,
            url: 'https://competitor-a.com',
            features: ['Advanced Analytics', 'Cloud Storage', '24/7 Support']
          },
          {
            name: `${queryText} Pro`,
            price: 129.99,
            rating: 4.4,
            url: 'https://competitor-b.com',
            features: ['Premium Features', 'API Access', 'Custom Reports']
          },
          {
            name: `Budget ${queryText}`,
            price: 49.99,
            rating: 3.8,
            url: 'https://budget-option.com',
            features: ['Basic Features', 'Email Support', 'Standard Analytics']
          }
        ]
      };
    }

    // Store competitor data
    for (const competitor of competitorResults.competitors) {
      await supabase
        .from('competitor_data')
        .insert({
          query_id: queryId,
          competitor_name: competitor.name,
          price: competitor.price,
          rating: competitor.rating,
          url: competitor.url,
          features: competitor.features || []
        });
    }

    console.log('Competitor analysis completed for query:', queryId);

    return new Response(JSON.stringify({ success: true, count: competitorResults.competitors.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in competitor-agent:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});