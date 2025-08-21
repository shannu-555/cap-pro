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
    console.log('Generating PDF report for query:', queryId);

    // Fetch all data for the report
    const [queryData, sentimentData, competitorData, trendData, reportData] = await Promise.all([
      supabase.from('research_queries').select('*').eq('id', queryId).single(),
      supabase.from('sentiment_analysis').select('*').eq('query_id', queryId),
      supabase.from('competitor_data').select('*').eq('query_id', queryId),
      supabase.from('trend_data').select('*').eq('query_id', queryId),
      supabase.from('research_reports').select('*').eq('query_id', queryId).single()
    ]);

    if (!queryData.data) {
      throw new Error('Query not found');
    }

    const query = queryData.data;
    const sentiment = sentimentData.data || [];
    const competitors = competitorData.data || [];
    const trends = trendData.data || [];
    const report = reportData.data;

    // Generate HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Market Research Report - ${query.query_text}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #4285f4; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #4285f4; border-left: 4px solid #4285f4; padding-left: 10px; }
            .metric { display: inline-block; background: #f5f5f5; padding: 10px; margin: 5px; border-radius: 5px; }
            .competitor { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .insight { background: #e8f4fd; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4285f4; }
            .recommendation { background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
            .positive { color: #28a745; }
            .negative { color: #dc3545; }
            .neutral { color: #6c757d; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Market Research Report</h1>
            <h2>${query.query_text}</h2>
            <p>Query Type: ${query.query_type.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
            <h2>Executive Summary</h2>
            <p>${report?.summary || 'Comprehensive market analysis completed with sentiment, competitor, and trend data.'}</p>
        </div>

        <div class="section">
            <h2>Sentiment Analysis</h2>
            <div class="metrics">
                ${sentiment.map(s => `
                    <div class="metric">
                        <strong>${s.source}</strong><br>
                        <span class="${s.sentiment}">${s.sentiment.toUpperCase()}</span> (${Math.round(s.confidence * 100)}%)
                    </div>
                `).join('')}
            </div>
            <table>
                <tr><th>Source</th><th>Sentiment</th><th>Confidence</th><th>Content</th></tr>
                ${sentiment.map(s => `
                    <tr>
                        <td>${s.source}</td>
                        <td class="${s.sentiment}">${s.sentiment}</td>
                        <td>${Math.round(s.confidence * 100)}%</td>
                        <td>${s.content}</td>
                    </tr>
                `).join('')}
            </table>
        </div>

        <div class="section">
            <h2>Competitor Analysis</h2>
            ${competitors.map(c => `
                <div class="competitor">
                    <h3>${c.competitor_name}</h3>
                    <p><strong>Price:</strong> $${c.price} | <strong>Rating:</strong> ${c.rating}/5.0</p>
                    <p><strong>Features:</strong> ${(c.features || []).join(', ')}</p>
                    ${c.url ? `<p><strong>URL:</strong> <a href="${c.url}">${c.url}</a></p>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>Market Trends</h2>
            <table>
                <tr><th>Keyword</th><th>Search Volume</th><th>Trend</th><th>Time Period</th></tr>
                ${trends.map(t => `
                    <tr>
                        <td>${t.keyword}</td>
                        <td>${t.search_volume?.toLocaleString()}</td>
                        <td>${t.trend_direction}</td>
                        <td>${t.time_period}</td>
                    </tr>
                `).join('')}
            </table>
        </div>

        ${report?.insights ? `
        <div class="section">
            <h2>Key Insights</h2>
            ${(report.insights || []).map(insight => `
                <div class="insight">
                    <h3>${insight.title}</h3>
                    <p><strong>Category:</strong> ${insight.category} | <strong>Priority:</strong> ${insight.priority}</p>
                    <p>${insight.description}</p>
                    ${insight.impact ? `<p><strong>Expected Impact:</strong> ${insight.impact}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${report?.recommendations ? `
        <div class="section">
            <h2>Strategic Recommendations</h2>
            ${(report.recommendations || []).map(rec => `
                <div class="recommendation">
                    <h3>${rec.action}</h3>
                    <p><strong>Priority:</strong> ${rec.priority} | <strong>Timeline:</strong> ${rec.timeline}</p>
                    <p><strong>Rationale:</strong> ${rec.rationale}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>Conclusion</h2>
            <p>This comprehensive market research analysis provides actionable insights for ${query.query_text}. 
            The data collected from sentiment analysis, competitor monitoring, and trend detection offers a 
            complete picture of the current market landscape and opportunities for strategic positioning.</p>
        </div>
    </body>
    </html>
    `;

    // For this demo, we'll return the HTML content
    // In production, you could use libraries like Puppeteer to generate actual PDFs
    const pdfUrl = `data:text/html;base64,${btoa(htmlContent)}`;

    // Update the report with PDF URL
    if (report) {
      await supabase
        .from('research_reports')
        .update({ pdf_url: pdfUrl })
        .eq('query_id', queryId);
    }

    console.log('PDF report generated for query:', queryId);

    return new Response(JSON.stringify({ 
      success: true, 
      pdfUrl: pdfUrl,
      htmlContent: htmlContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});