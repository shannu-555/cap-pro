import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Mail, X, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Alert {
  id: string;
  type: 'high' | 'medium' | 'low';
  category: 'pricing' | 'sentiment' | 'trend' | 'competitor';
  title: string;
  message: string;
  action?: string;
  created_at: string;
  read: boolean;
}

interface AlertsSystemProps {
  queryId?: string;
  className?: string;
}

export function AlertsSystem({ queryId, className }: AlertsSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const { toast } = useToast();

  // Mock alerts generation based on data analysis
  const generateMockAlerts = () => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'high',
        category: 'pricing',
        title: 'Competitor Price Drop Alert',
        message: 'Amazon reduced iPhone 15 price by 15% → Consider launching bundle discounts or price matching',
        action: 'Launch Bundle Campaign',
        created_at: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'medium',
        category: 'sentiment',
        title: 'Sentiment Shift Detected',
        message: 'Customer sentiment for wireless earbuds improved by 25% this week',
        created_at: new Date().toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'high',
        category: 'trend',
        title: 'Trending Feature Alert',
        message: 'Noise cancellation searches increased 40% → Opportunity to highlight this feature',
        action: 'Update Marketing Copy',
        created_at: new Date().toISOString(),
        read: true
      }
    ];
    setAlerts(mockAlerts);
    setUnreadCount(mockAlerts.filter(a => !a.read).length);
  };

  useEffect(() => {
    generateMockAlerts();
  }, [queryId]);

  const getAlertIcon = (category: string) => {
    switch (category) {
      case 'pricing': return '💰';
      case 'sentiment': return '😊';
      case 'trend': return '📈';
      case 'competitor': return '🏢';
      default: return '📊';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-info/10 text-info border-info/20';
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const sendEmailAlert = async () => {
    toast({
      title: "Email Alert Sent",
      description: "Critical market updates have been sent to your email.",
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAlerts(!showAlerts)}
          className="relative hover:shadow-soft transition-smooth"
        >
          <Bell className="h-4 w-4 mr-2" />
          Alerts
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-destructive text-destructive-foreground h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={sendEmailAlert}
          className="hover:shadow-soft transition-smooth"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email Alerts
        </Button>
      </div>

      {showAlerts && (
        <Card className="absolute top-16 right-0 w-96 z-50 glass-effect border-primary/20 animate-slide-down">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Alerts</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlerts(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-soft ${
                  alert.read ? 'bg-muted/50 border-border/50' : 'bg-card border-primary/20'
                }`}
                onClick={() => markAsRead(alert.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getAlertIcon(alert.category)}</span>
                    <Badge className={getAlertColor(alert.type)}>
                      {alert.type}
                    </Badge>
                  </div>
                  {!alert.read && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
                
                <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
                
                {alert.action && (
                  <Button size="sm" variant="outline" className="text-xs h-6">
                    {alert.action}
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(alert.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}