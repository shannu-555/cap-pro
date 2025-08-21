import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface TrendData {
  id: string;
  keyword: string;
  search_volume: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  time_period: string;
  data_points: Array<{ date: string; volume: number; interest: number }>;
}

interface TrendAnalysisProps {
  data: TrendData[];
}

export function TrendAnalysis({ data }: TrendAnalysisProps) {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return 'bg-success/10 text-success border-success/20';
      case 'decreasing':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const totalVolume = data.reduce((sum, item) => sum + (item.search_volume || 0), 0);
  const increasingTrends = data.filter(d => d.trend_direction === 'increasing').length;
  const decreasingTrends = data.filter(d => d.trend_direction === 'decreasing').length;

  const getMiniChart = (dataPoints: Array<{ date: string; volume: number; interest: number }>) => {
    if (!dataPoints || dataPoints.length < 2) return null;
    
    const max = Math.max(...dataPoints.map(d => d.interest));
    const min = Math.min(...dataPoints.map(d => d.interest));
    const range = max - min || 1;
    
    const points = dataPoints.map((point, index) => {
      const x = (index / (dataPoints.length - 1)) * 100;
      const y = 100 - ((point.interest - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    const isIncreasing = dataPoints[dataPoints.length - 1].interest > dataPoints[0].interest;
    
    return (
      <svg className="w-16 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={isIncreasing ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
          strokeWidth="2"
          className="opacity-70"
        />
      </svg>
    );
  };

  return (
    <Card className="agent-card animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-success" />
          Market Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4 p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{totalVolume.toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <span className="text-2xl font-bold text-success">{increasingTrends}</span>
                </div>
                <p className="text-sm text-muted-foreground">Rising</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <span className="text-2xl font-bold text-destructive">{decreasingTrends}</span>
                </div>
                <p className="text-sm text-muted-foreground">Declining</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Trending Keywords</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.map((trend) => (
                  <div
                    key={trend.id}
                    className="border border-border/50 rounded-lg p-4 bg-card/50 hover-lift"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h5 className="font-medium">{trend.keyword}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {trend.search_volume?.toLocaleString()} searches
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {trend.time_period}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getMiniChart(trend.data_points)}
                        <div className="text-right">
                          <Badge className={getTrendColor(trend.trend_direction)}>
                            <span className="flex items-center gap-1">
                              {getTrendIcon(trend.trend_direction)}
                              {trend.trend_direction}
                            </span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {trend.data_points && trend.data_points.length > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Start: {trend.data_points[0]?.interest}% interest
                        </span>
                        <span>
                          Current: {trend.data_points[trend.data_points.length - 1]?.interest}% interest
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No trend data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}