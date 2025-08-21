import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, TrendingUp, Brain, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface AgentStatusProps {
  agentData: {
    sentiment: any[];
    competitors: any[];
    trends: any[];
    insights: any[];
  };
  isLoading: boolean;
}

export function AgentStatus({ agentData, isLoading }: AgentStatusProps) {
  const agents = [
    {
      name: 'Sentiment Agent',
      icon: <Sparkles className="h-5 w-5" />,
      status: agentData.sentiment.length > 0 ? 'completed' : (isLoading ? 'processing' : 'pending'),
      count: agentData.sentiment.length,
      color: 'accent',
      description: 'Analyzing customer sentiment across social media and reviews'
    },
    {
      name: 'Competitor Agent',
      icon: <Users className="h-5 w-5" />,
      status: agentData.competitors.length > 0 ? 'completed' : (isLoading ? 'processing' : 'pending'),
      count: agentData.competitors.length,
      color: 'info',
      description: 'Monitoring competitor pricing and feature analysis'
    },
    {
      name: 'Trend Agent',
      icon: <TrendingUp className="h-5 w-5" />,
      status: agentData.trends.length > 0 ? 'completed' : (isLoading ? 'processing' : 'pending'),
      count: agentData.trends.length,
      color: 'success',
      description: 'Tracking search volumes and market trends'
    },
    {
      name: 'Insight Agent',
      icon: <Brain className="h-5 w-5" />,
      status: agentData.insights.length > 0 ? 'completed' : (isLoading ? 'processing' : 'pending'),
      count: agentData.insights.length,
      color: 'warning',
      description: 'Generating strategic recommendations and insights'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'processing':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="glass-effect border-primary/10 animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {agents.map((agent, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50 hover-lift"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${agent.color}/10`}>
                  {agent.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{agent.name}</h4>
                    {getStatusIcon(agent.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {agent.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {agent.count} items
                  </Badge>
                )}
                <Badge className={getStatusColor(agent.status)}>
                  {agent.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}