-- Grant INSERT permissions to agents for storing data

-- Allow inserting competitor data (for competitor-agent)
CREATE POLICY "Allow agent insertions for competitor data"
ON public.competitor_data
FOR INSERT
WITH CHECK (true);

-- Allow inserting sentiment analysis data (for sentiment-agent)
CREATE POLICY "Allow agent insertions for sentiment data"
ON public.sentiment_analysis
FOR INSERT
WITH CHECK (true);

-- Allow inserting trend data (for trend-agent)
CREATE POLICY "Allow agent insertions for trend data"
ON public.trend_data
FOR INSERT
WITH CHECK (true);

-- Allow inserting research reports (for insight-agent and report generation)
CREATE POLICY "Allow agent insertions for research reports"
ON public.research_reports
FOR INSERT
WITH CHECK (true);