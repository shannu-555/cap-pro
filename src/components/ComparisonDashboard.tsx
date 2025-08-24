import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import { TrendingUp, Users, Star, DollarSign, Zap, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompetitorData {
  name: string;
  price: number;
  rating: number;
  sentiment: number;
  features: number;
  marketShare: number;
}

interface WhatIfScenario {
  priceChange: number;
  expectedSentiment: number;
  competitorResponse: string;
}

export function ComparisonDashboard() {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [whatIfPrice, setWhatIfPrice] = useState<number>(0);
  const [scenario, setScenario] = useState<WhatIfScenario | null>(null);
  const { toast } = useToast();

  // Mock competitor data
  useEffect(() => {
    const mockData: CompetitorData[] = [
      { name: 'Apple', price: 999, rating: 4.5, sentiment: 85, features: 95, marketShare: 23 },
      { name: 'Samsung', price: 899, rating: 4.3, sentiment: 78, features: 90, marketShare: 21 },
      { name: 'Google', price: 799, rating: 4.1, sentiment: 82, features: 85, marketShare: 12 },
      { name: 'OnePlus', price: 699, rating: 4.2, sentiment: 75, features: 80, marketShare: 8 },
      { name: 'Xiaomi', price: 599, rating: 3.9, sentiment: 70, features: 75, marketShare: 15 }
    ];
    setCompetitors(mockData);
    setSelectedCompetitors(['Apple', 'Samsung', 'Google']);
  }, []);

  const selectedData = competitors.filter(comp => selectedCompetitors.includes(comp.name));

  const radarData = selectedData.map(comp => ({
    name: comp.name,
    Price: (1000 - comp.price) / 10, // Invert price for radar (higher is better)
    Rating: comp.rating * 20,
    Sentiment: comp.sentiment,
    Features: comp.features,
    'Market Share': comp.marketShare * 4
  }));

  const priceComparisonData = selectedData.map(comp => ({
    name: comp.name,
    price: comp.price,
    rating: comp.rating
  }));

  const heatmapData = selectedData.map(comp => ({
    name: comp.name,
    sentiment: comp.sentiment,
    color: comp.sentiment > 80 ? '#10B981' : comp.sentiment > 70 ? '#F59E0B' : '#EF4444'
  }));

  const runWhatIfAnalysis = () => {
    if (whatIfPrice <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price for analysis.",
        variant: "destructive"
      });
      return;
    }

    const priceChange = ((whatIfPrice - 999) / 999) * 100;
    const expectedSentiment = Math.max(0, Math.min(100, 85 + (priceChange * -0.5))); // Price decrease improves sentiment
    
    let competitorResponse = "No significant response expected";
    if (Math.abs(priceChange) > 10) {
      competitorResponse = priceChange > 0 ? 
        "Competitors may launch promotional campaigns" : 
        "Competitors likely to follow with price reductions";
    }

    setScenario({
      priceChange,
      expectedSentiment,
      competitorResponse
    });

    toast({
      title: "Analysis Complete",
      description: `Scenario analysis for $${whatIfPrice} pricing completed.`
    });
  };

  return (
    <Card className="glass-effect border-primary/20 animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Interactive Comparison Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scorecards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scorecards">Scorecards</TabsTrigger>
            <TabsTrigger value="radar">Feature Radar</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment Map</TabsTrigger>
            <TabsTrigger value="whatif">What-If Analysis</TabsTrigger>
          </TabsList>

          {/* Competitor Selection */}
          <div className="space-y-4">
            <Label>Select Competitors to Compare</Label>
            <div className="flex flex-wrap gap-2">
              {competitors.map(comp => (
                <Badge
                  key={comp.name}
                  variant={selectedCompetitors.includes(comp.name) ? "default" : "outline"}
                  className="cursor-pointer hover:shadow-soft transition-all"
                  onClick={() => {
                    setSelectedCompetitors(prev => 
                      prev.includes(comp.name) 
                        ? prev.filter(name => name !== comp.name)
                        : [...prev, comp.name]
                    );
                  }}
                >
                  {comp.name}
                </Badge>
              ))}
            </div>
          </div>

          <TabsContent value="scorecards" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedData.map(competitor => (
                <Card key={competitor.name} className="hover:shadow-soft transition-all border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{competitor.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="text-sm">Price</span>
                      </div>
                      <span className="font-semibold">${competitor.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-warning" />
                        <span className="text-sm">Rating</span>
                      </div>
                      <span className="font-semibold">{competitor.rating}/5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-info" />
                        <span className="text-sm">Sentiment</span>
                      </div>
                      <span className="font-semibold">{competitor.sentiment}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-accent" />
                        <span className="text-sm">Features</span>
                      </div>
                      <span className="font-semibold">{competitor.features}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="radar" className="space-y-4">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData[0] ? [radarData[0]] : []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {selectedData.map((comp, index) => (
                    <Radar
                      key={comp.name}
                      name={comp.name}
                      dataKey={comp.name}
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                      fill={`hsl(${index * 60}, 70%, 50%)`}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {selectedData.map(competitor => (
                <div
                  key={competitor.name}
                  className="p-4 rounded-lg text-center transition-all hover:scale-105"
                  style={{ backgroundColor: `${competitor.sentiment > 80 ? '#10B981' : competitor.sentiment > 70 ? '#F59E0B' : '#EF4444'}20` }}
                >
                  <h4 className="font-semibold mb-2">{competitor.name}</h4>
                  <div className="text-2xl font-bold" style={{ color: competitor.sentiment > 80 ? '#10B981' : competitor.sentiment > 70 ? '#F59E0B' : '#EF4444' }}>
                    {competitor.sentiment}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sentiment Score</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="whatif" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  What-If Price Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">New Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={whatIfPrice || ''}
                      onChange={(e) => setWhatIfPrice(Number(e.target.value))}
                      placeholder="Enter new price..."
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={runWhatIfAnalysis} className="w-full">
                      Run Analysis
                    </Button>
                  </div>
                </div>

                {scenario && (
                  <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold">Scenario Results</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Price Change</p>
                        <p className={`font-semibold ${scenario.priceChange > 0 ? 'text-destructive' : 'text-success'}`}>
                          {scenario.priceChange > 0 ? '+' : ''}{scenario.priceChange.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expected Sentiment</p>
                        <p className="font-semibold text-info">{scenario.expectedSentiment.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Competitor Response</p>
                        <p className="font-semibold">{scenario.competitorResponse}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}