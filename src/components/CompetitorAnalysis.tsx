import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ExternalLink, Star, DollarSign } from 'lucide-react';

interface CompetitorData {
  id: string;
  competitor_name: string;
  price: number;
  rating: number;
  url: string;
  features: string[];
}

interface CompetitorAnalysisProps {
  data: CompetitorData[];
}

export function CompetitorAnalysis({ data }: CompetitorAnalysisProps) {
  const sortedData = [...data].sort((a, b) => b.rating - a.rating);
  const averagePrice = data.length > 0 ? data.reduce((sum, item) => sum + (item.price || 0), 0) / data.length : 0;
  const averageRating = data.length > 0 ? data.reduce((sum, item) => sum + (item.rating || 0), 0) / data.length : 0;

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-warning fill-current'
            : i < rating
            ? 'text-warning fill-current opacity-50'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const getPriceCategory = (price: number) => {
    if (price < averagePrice * 0.8) return { label: 'Budget', color: 'bg-success/10 text-success border-success/20' };
    if (price > averagePrice * 1.2) return { label: 'Premium', color: 'bg-warning/10 text-warning border-warning/20' };
    return { label: 'Mid-range', color: 'bg-info/10 text-info border-info/20' };
  };

  return (
    <Card className="agent-card animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6 text-info" />
          Competitor Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-6 p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  <span className="text-2xl font-bold">${averagePrice.toFixed(0)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Average Price</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-warning" />
                  <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Top Competitors</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sortedData.map((competitor) => {
                  const priceCategory = getPriceCategory(competitor.price || 0);
                  return (
                    <div
                      key={competitor.id}
                      className="border border-border/50 rounded-lg p-4 bg-card/50 hover-lift space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium">{competitor.competitor_name}</h5>
                            {competitor.url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => window.open(competitor.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-1">
                              {getRatingStars(competitor.rating || 0)}
                              <span className="text-sm text-muted-foreground ml-1">
                                {competitor.rating?.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">
                                ${competitor.price?.toFixed(2)}
                              </span>
                              <Badge className={priceCategory.color}>
                                {priceCategory.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {competitor.features && competitor.features.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Key Features:</p>
                          <div className="flex flex-wrap gap-1">
                            {competitor.features.slice(0, 6).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {competitor.features.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{competitor.features.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No competitor data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}