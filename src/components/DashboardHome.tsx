import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Brain,
  ArrowUpRight,
  Activity,
  Target,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalQueries: number;
  activeResearch: number;
  sentimentScore: number;
  competitorAlerts: number;
  trendingKeywords: string[];
}

interface DashboardHomeProps {
  onNavigate: (tab: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalQueries: 0,
    activeResearch: 0,
    sentimentScore: 0,
    competitorAlerts: 0,
    trendingKeywords: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      // Get research queries stats
      const { data: queries, error: queriesError } = await supabase
        .from('research_queries')
        .select('status')
        .eq('user_id', user?.id);

      if (!queriesError && queries) {
        const totalQueries = queries.length;
        const activeResearch = queries.filter(q => q.status === 'processing').length;
        
        // Get latest sentiment analysis
        const { data: sentiment } = await supabase
          .from('sentiment_analysis')
          .select('confidence')
          .order('created_at', { ascending: false })
          .limit(10);

        const avgSentiment = sentiment?.length 
          ? Math.round(sentiment.reduce((acc, s) => acc + s.confidence, 0) / sentiment.length * 100)
          : 0;

        // Get competitor alerts
        const { data: competitors } = await supabase
          .from('competitor_data')
          .select('id')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        // Get trending keywords from recent trend data
        const { data: trends } = await supabase
          .from('trend_data')
          .select('keyword')
          .order('search_volume', { ascending: false })
          .limit(5);

        setStats({
          totalQueries,
          activeResearch,
          sentimentScore: avgSentiment,
          competitorAlerts: competitors?.length || 0,
          trendingKeywords: trends?.map(t => t.keyword) || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Start Research",
      description: "Analyze products or companies",
      icon: Search,
      action: () => onNavigate('research'),
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Compare Products",
      description: "Side-by-side analysis",
      icon: BarChart3,
      action: () => onNavigate('comparison'),
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "AI Assistant",
      description: "Get instant insights",
      icon: Brain,
      action: () => onNavigate('assistant'),
      color: "from-green-500 to-green-600"
    }
  ];

  const statCards = [
    {
      title: "Total Research",
      value: stats.totalQueries,
      icon: Target,
      change: "+12%",
      color: "text-blue-500"
    },
    {
      title: "Active Queries",
      value: stats.activeResearch,
      icon: Activity,
      change: "Live",
      color: "text-green-500"
    },
    {
      title: "Sentiment Score",
      value: `${stats.sentimentScore}%`,
      icon: TrendingUp,
      change: "+5%",
      color: "text-purple-500"
    },
    {
      title: "New Alerts",
      value: stats.competitorAlerts,
      icon: Zap,
      change: "24h",
      color: "text-orange-500"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <Star className="h-4 w-4" />
          Welcome to AI Market Research
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Discover Market Insights
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Leverage AI-powered agents to analyze sentiment, track competitors, and identify market trends in real-time.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="professional-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={action.title}
                onClick={action.action}
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-4 hover:shadow-glow transition-smooth"
              >
                <div className={`p-3 rounded-full bg-gradient-to-r ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 ml-auto" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Keywords */}
      {stats.trendingKeywords.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.trendingKeywords.map((keyword, index) => (
                  <div key={keyword} className="flex items-center justify-between">
                    <span className="font-medium">{keyword}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(5 - index) * 20} className="w-20" />
                      <Badge variant="secondary">{100 - index * 10}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                AI Agent Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Sentiment Agent", status: "Active", accuracy: 94 },
                  { name: "Competitor Agent", status: "Active", accuracy: 88 },
                  { name: "Trend Agent", status: "Active", accuracy: 91 },
                  { name: "Insight Agent", status: "Active", accuracy: 96 }
                ].map((agent) => (
                  <div key={agent.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{agent.accuracy}%</span>
                      <Badge className="bg-green-500/10 text-green-500">{agent.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}