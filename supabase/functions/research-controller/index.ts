import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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

    const { queryId } = await req.json();
    console.log('Processing research query:', queryId);

    // Get the query details
    const { data: query, error: queryError } = await supabase
      .from('research_queries')
      .select('*')
      .eq('id', queryId)
      .single();

    if (queryError || !query) {
      throw new Error('Query not found');
    }

    // Update status to processing
    await supabase
      .from('research_queries')
      .update({ status: 'processing' })
      .eq('id', queryId);

    // Trigger all agents in parallel
    const agentPromises = [
      supabase.functions.invoke('sentiment-agent', {
        body: { queryId, queryText: query.query_text, queryType: query.query_type }
      }),
      supabase.functions.invoke('competitor-agent', {
        body: { queryId, queryText: query.query_text, queryType: query.query_type }
      }),
      supabase.functions.invoke('trend-agent', {
        body: { queryId, queryText: query.query_text, queryType: query.query_type }
      })
    ];

    // Wait for all agents to complete
    const agentResults = await Promise.allSettled(agentPromises);
    console.log('Agent results:', agentResults);

    // Generate insights after all agents complete
    await supabase.functions.invoke('insight-agent', {
      body: { queryId, queryText: query.query_text, queryType: query.query_type }
    });

    // Update status to completed
    await supabase
      .from('research_queries')
      .update({ status: 'completed' })
      .eq('id', queryId);

    console.log('Research processing completed for query:', queryId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in research-controller:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});