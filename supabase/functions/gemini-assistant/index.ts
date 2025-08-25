import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

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
    console.log('Gemini assistant processing:', message, userId);

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    // Enhance the prompt with market research context
    const enhancedPrompt = `
You are an expert AI Market Research Assistant. You help users analyze market data, competitors, and trends. 
Respond in a conversational, helpful manner. If the user asks about market research tasks, provide specific, actionable advice.

Key capabilities you should mention when relevant:
- Sentiment Analysis: Track customer opinions and emotions
- Competitor Monitoring: Price tracking, feature comparisons
- Trend Detection: Emerging patterns and market shifts
- Insight Generation: Actionable recommendations
- Report Generation: Comprehensive PDF reports

User message: ${message}

Provide a helpful, conversational response. If they're asking for analysis, suggest specific research actions they can take.
Keep your response concise but informative (2-3 sentences max unless they ask for details).
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I'm here to help with your market research needs. What would you like to analyze today?";

    console.log('Gemini response generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      response: generatedText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: "I'm here to help with market research analysis. What specific product or company would you like me to research?"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});