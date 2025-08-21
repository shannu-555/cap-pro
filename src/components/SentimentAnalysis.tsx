import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface SentimentData {
  id: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  content: string;
  topics: string[];
}

interface SentimentAnalysisProps {
  data: SentimentData[];
}

export function SentimentAnalysis({ data }: SentimentAnalysisProps) {
  const sentimentCounts = {
    positive: data.filter(d => d.sentiment === 'positive').length,
    negative: data.filter(d => d.sentiment === 'negative').length,
    neutral: data.filter(d => d.sentiment === 'neutral').length,
  };

  const total = data.length;
  const positivePercent = total > 0 ? (sentimentCounts.positive / total) * 100 : 0;
  const negativePercent = total > 0 ? (sentimentCounts.negative / total) * 100 : 0;
  const neutralPercent = total > 0 ? (sentimentCounts.neutral / total) * 100 : 0;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-success" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-success/10 text-success border-success/20';
      case 'negative':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="agent-card animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {total > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-success" />
                  <span className="text-2xl font-bold text-success">{positivePercent.toFixed(0)}%</span>
                </div>
                <p className="text-sm text-muted-foreground">Positive</p>
                <Progress value={positivePercent} className="h-2" />
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Minus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold text-muted-foreground">{neutralPercent.toFixed(0)}%</span>
                </div>
                <p className="text-sm text-muted-foreground">Neutral</p>
                <Progress value={neutralPercent} className="h-2" />
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <ThumbsDown className="h-5 w-5 text-destructive" />
                  <span className="text-2xl font-bold text-destructive">{negativePercent.toFixed(0)}%</span>
                </div>
                <p className="text-sm text-muted-foreground">Negative</p>
                <Progress value={negativePercent} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Recent Mentions</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.slice(0, 6).map((item) => (
                  <div key={item.id} className="border border-border/50 rounded-lg p-4 bg-card/50 hover-lift">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(item.sentiment)}
                        <span className="font-medium text-sm">{item.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSentimentColor(item.sentiment)}>
                          {item.sentiment}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.content}</p>
                    {item.topics && item.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No sentiment data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}