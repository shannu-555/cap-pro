import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Lightbulb, Target, Clock, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InsightData {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact?: string;
}

interface RecommendationData {
  action: string;
  rationale: string;
  timeline: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
}

interface ReportData {
  title: string;
  summary: string;
  insights: InsightData[];
  recommendations: RecommendationData[];
  pdf_url?: string;
}

interface InsightGenerationProps {
  data: ReportData | null;
  queryId: string;
}

export function InsightGeneration({ data, queryId }: InsightGenerationProps) {
  const { toast } = useToast();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-info/10 text-info border-info/20';
    }
  };

  const getTimelineColor = (timeline: string) => {
    switch (timeline) {
      case 'immediate':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'short-term':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-info/10 text-info border-info/20';
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const { data: pdfData, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: { queryId }
      });

      if (error) throw error;

      if (pdfData?.htmlContent) {
        // Open in new window for viewing
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(pdfData.htmlContent);
          newWindow.document.close();
        }
        
        toast({
          title: "Report Generated",
          description: "Your comprehensive market research report is ready!",
        });
      } else {
        throw new Error('No report content generated');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="agent-card animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-warning" />
            Strategic Insights
          </CardTitle>
          <Button
            onClick={handleGeneratePDF}
            className="gradient-bg hover:shadow-glow transition-smooth"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data ? (
          <>
            {data.summary && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Executive Summary
                </h4>
                <p className="text-sm text-muted-foreground">{data.summary}</p>
              </div>
            )}

            {data.insights && data.insights.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Insights ({data.insights.length})
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="border border-border/50 rounded-lg p-4 bg-card/50 hover-lift space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium">{insight.title}</h5>
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                          {insight.impact && (
                            <p className="text-xs text-primary font-medium">{insight.impact}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {insight.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.recommendations && data.recommendations.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Strategic Recommendations ({data.recommendations.length})
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="border border-border/50 rounded-lg p-4 bg-card/50 hover-lift space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h5 className="font-medium mb-2">{rec.action}</h5>
                          <p className="text-sm text-muted-foreground mb-3">{rec.rationale}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <Badge className={getTimelineColor(rec.timeline)}>
                            <Clock className="h-3 w-3 mr-1" />
                            {rec.timeline}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!data.insights || data.insights.length === 0) && (!data.recommendations || data.recommendations.length === 0) && (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse-glow" />
                <p className="text-muted-foreground">AI is generating strategic insights...</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No insights available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}