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
      console.error('Query not found:', queryError);
      throw new Error('Query not found');
    }

    console.log('Found query:', query.query_text, query.query_type);

    // Update status to processing
    await supabase
      .from('research_queries')
      .update({ status: 'processing' })
      .eq('id', queryId);

    console.log('Updated status to processing');

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

    console.log('Triggering agents...');

    // Wait for all agents to complete
    const agentResults = await Promise.allSettled(agentPromises);
    console.log('Agent results:', agentResults);

    // Check if any agent failed
    const failedAgents = agentResults.filter(result => result.status === 'rejected');
    if (failedAgents.length > 0) {
      console.error('Some agents failed:', failedAgents);
    }

    // Generate insights after all agents complete (even if some failed)
    try {
      console.log('Triggering insight agent...');
      const insightResult = await supabase.functions.invoke('insight-agent', {
        body: { queryId, queryText: query.query_text, queryType: query.query_type }
      });
      console.log('Insight agent result:', insightResult);

      // Process RAG chunks after agents complete
      try {
        console.log('Processing RAG chunks for vector search...');
        const ragResult = await supabase.functions.invoke('rag-processor', {
          body: { queryId, action: 'process' }
        });
        console.log('RAG processing result:', ragResult);
      } catch (ragError) {
        console.error('RAG processing failed (optional):', ragError);
      }

      // Auto-generate PDF report after insights are ready
      try {
        console.log('Auto-generating PDF report...');
        const pdfResult = await supabase.functions.invoke('generate-pdf-report', {
          body: { queryId }
        });
        console.log('PDF generation result:', pdfResult);
      } catch (pdfError) {
        console.error('PDF auto-generation failed:', pdfError);
      }
    } catch (insightError) {
      console.error('Insight agent failed:', insightError);
    }

    // Update status to completed (even if some agents failed)
    await supabase
      .from('research_queries')
      .update({ status: 'completed' })
      .eq('id', queryId);

    console.log('Research processing completed for query:', queryId);

    return new Response(JSON.stringify({ 
      success: true, 
      failedAgents: failedAgents.length,
      totalAgents: agentResults.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in research-controller:', error);
    
    // Try to update the query status to failed
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { queryId } = await req.json().catch(() => ({}));
      
      if (queryId) {
        await supabase
          .from('research_queries')
          .update({ status: 'failed' })
          .eq('id', queryId);
      }
    } catch (updateError) {
      console.error('Failed to update query status:', updateError);
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});