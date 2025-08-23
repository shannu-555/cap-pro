import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AgentStatus } from '@/components/AgentStatus';
import { SentimentAnalysis } from '@/components/SentimentAnalysis';
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis';
import { TrendAnalysis } from '@/components/TrendAnalysis';
import { InsightGeneration } from '@/components/InsightGeneration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw, FileText, Calendar, Target, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ResearchResultsProps {
  queryId: string;
}

interface ResearchQuery {
  id: string;
  query_text: string;
  query_type: string;
  status: string;
  created_at: string;
}

export function ResearchResults({ queryId }: ResearchResultsProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState<ResearchQuery | null>(null);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [competitorData, setCompetitorData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchResearchData = async () => {
    if (!queryId || !user) return;

    try {
      const [queryRes, sentimentRes, competitorRes, trendRes, reportRes] = await Promise.all([
        supabase.from('research_queries').select('*').eq('id', queryId).single(),
        supabase.from('sentiment_analysis').select('*').eq('query_id', queryId),
        supabase.from('competitor_data').select('*').eq('query_id', queryId),
        supabase.from('trend_data').select('*').eq('query_id', queryId),
        supabase.from('research_reports').select('*').eq('query_id', queryId).single()
      ]);

      if (queryRes.data) setQuery(queryRes.data);
      if (sentimentRes.data) setSentimentData(sentimentRes.data);
      if (competitorRes.data) setCompetitorData(competitorRes.data);
      if (trendRes.data) setTrendData(trendRes.data);
      if (reportRes.data) setReportData(reportRes.data);

    } catch (error) {
      console.error('Error fetching research data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchData();
    
    // Set up real-time listeners
    const channels = [
      supabase.channel('sentiment-updates').on('postgres_changes', {
        event: '*', schema: 'public', table: 'sentiment_analysis',
        filter: `query_id=eq.${queryId}`
      }, () => fetchResearchData()),
      
      supabase.channel('competitor-updates').on('postgres_changes', {
        event: '*', schema: 'public', table: 'competitor_data',
        filter: `query_id=eq.${queryId}`
      }, () => fetchResearchData()),
      
      supabase.channel('trend-updates').on('postgres_changes', {
        event: '*', schema: 'public', table: 'trend_data',
        filter: `query_id=eq.${queryId}`
      }, () => fetchResearchData()),
      
      supabase.channel('report-updates').on('postgres_changes', {
        event: '*', schema: 'public', table: 'research_reports',
        filter: `query_id=eq.${queryId}`
      }, () => fetchResearchData())
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [queryId, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'processing': return 'bg-warning/10 text-warning border-warning/20 animate-pulse';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const agentData = {
    sentiment: sentimentData,
    competitors: competitorData,
    trends: trendData,
    insights: reportData?.insights || []
  };

  if (loading) {
    return (
      <Card className="glass-effect border-primary/20 animate-slide-up">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Initializing AI Agents</h3>
              <p className="text-muted-foreground">Our intelligent agents are analyzing your query...</p>
            </div>
            <Progress value={33} className="w-64 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!query) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Query not found</p>
          <Button 
            onClick={fetchResearchData} 
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show failed state with retry option
  if (query.status === 'failed') {
    return (
      <Card className="glass-effect border-destructive/20 animate-slide-up">
        <CardContent className="py-12 text-center space-y-4">
          <div className="text-destructive">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Research Failed</h3>
            <p className="text-sm text-muted-foreground mt-2">
              There was an error processing your research query. Please try again.
            </p>
          </div>
          <Button onClick={fetchResearchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Research
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Query Overview */}
      <Card className="glass-effect border-primary/20 animate-slide-up">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3">
                <Target className="h-6 w-6 text-primary" />
                {query.query_text}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {query.query_type.toUpperCase()} Analysis
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(query.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(query.status)}>
                {query.status}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchResearchData}
                className="hover:shadow-soft transition-smooth"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Agent Status Overview */}
      <AgentStatus agentData={agentData} isLoading={loading} />

      {/* Agent Results Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        <SentimentAnalysis data={sentimentData} />
        <CompetitorAnalysis data={competitorData} />
        <TrendAnalysis data={trendData} />
        <InsightGeneration data={reportData} queryId={queryId} />
      </div>
    </div>
  );
}