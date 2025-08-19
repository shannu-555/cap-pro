import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, BarChart3, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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

interface SentimentData {
  sentiment: string;
  confidence: number;
  topics: string[];
  source: string;
  content: string;
}

interface CompetitorData {
  competitor_name: string;
  price: number;
  rating: number;
  features: any;
  url: string;
}

interface TrendData {
  keyword: string;
  search_volume: number;
  trend_direction: string;
  time_period: string;
}

export function ResearchResults({ queryId }: ResearchResultsProps) {
  const [query, setQuery] = useState<ResearchQuery | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [competitorData, setCompetitorData] = useState<CompetitorData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchResearchData();
    
    // Set up real-time updates
    const channel = supabase
      .channel('research-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'research_queries',
        filter: `id=eq.${queryId}`
      }, () => {
        fetchResearchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryId]);

  const fetchResearchData = async () => {
    try {
      // Fetch main query
      const { data: queryData, error: queryError } = await supabase
        .from('research_queries')
        .select('*')
        .eq('id', queryId)
        .single();

      if (queryError) throw queryError;
      setQuery(queryData);

      // Fetch sentiment data
      const { data: sentiment, error: sentimentError } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('query_id', queryId);

      if (!sentimentError) setSentimentData(sentiment || []);

      // Fetch competitor data
      const { data: competitors, error: competitorError } = await supabase
        .from('competitor_data')
        .select('*')
        .eq('query_id', queryId);

      if (!competitorError) setCompetitorData(competitors || []);

      // Fetch trend data
      const { data: trends, error: trendError } = await supabase
        .from('trend_data')
        .select('*')
        .eq('query_id', queryId);

      if (!trendError) setTrendData(trends || []);

    } catch (error: any) {
      console.error('Error fetching research data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch research data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { queryId }
      });

      if (error) throw error;

      toast({
        title: "Report Generated",
        description: "Your market research report is ready for download.",
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!query) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const sentimentCounts = sentimentData.reduce((acc, item) => {
    acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalSentiments = sentimentData.length;
  const positivePercentage = totalSentiments ? (sentimentCounts.positive || 0) / totalSentiments * 100 : 0;
  const neutralPercentage = totalSentiments ? (sentimentCounts.neutral || 0) / totalSentiments * 100 : 0;
  const negativePercentage = totalSentiments ? (sentimentCounts.negative || 0) / totalSentiments * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Research: {query.query_text}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {query.query_type} analysis • Started {new Date(query.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(query.status)}>
              {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
            </Badge>
            <Button onClick={generateReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Progress value={33} className="w-full" />
              <p className="text-sm text-muted-foreground">
                AI agents are analyzing your query...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sentiment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalSentiments > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Positive</span>
                      <span>{positivePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={positivePercentage} className="h-2 bg-green-100 [&>div]:bg-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Neutral</span>
                      <span>{neutralPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={neutralPercentage} className="h-2 bg-gray-100 [&>div]:bg-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Negative</span>
                      <span>{negativePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={negativePercentage} className="h-2 bg-red-100 [&>div]:bg-red-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {totalSentiments} sources analyzed
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sentiment data available yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Competitor Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Competitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {competitorData.length > 0 ? (
                <div className="space-y-3">
                  {competitorData.slice(0, 5).map((competitor, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{competitor.competitor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {competitor.rating ? `${competitor.rating}★` : 'No rating'}
                        </p>
                      </div>
                      <div className="text-right">
                        {competitor.price && (
                          <p className="font-medium text-sm">${competitor.price}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {competitorData.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{competitorData.length - 5} more competitors
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No competitor data available yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <div className="space-y-3">
                  {trendData.slice(0, 5).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{trend.keyword}</p>
                        <p className="text-xs text-muted-foreground">
                          {trend.search_volume ? `${trend.search_volume.toLocaleString()} searches` : 'No volume data'}
                        </p>
                      </div>
                      <Badge 
                        variant={trend.trend_direction === 'rising' ? 'default' : 
                                trend.trend_direction === 'falling' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {trend.trend_direction}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No trend data available yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}