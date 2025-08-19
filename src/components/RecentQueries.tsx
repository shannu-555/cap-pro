import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RecentQueriesProps {
  onQuerySelected: (queryId: string) => void;
}

interface QueryItem {
  id: string;
  query_text: string;
  query_type: string;
  status: string;
  created_at: string;
}

export function RecentQueries({ onQuerySelected }: RecentQueriesProps) {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchQueries();
    }
  }, [user]);

  const fetchQueries = async () => {
    try {
      const { data, error } = await supabase
        .from('research_queries')
        .select('id, query_text, query_type, status, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setQueries(data || []);
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading recent queries...</p>
        </CardContent>
      </Card>
    );
  }

  if (queries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No research queries yet. Start by searching for a product or company above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Research
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {queries.map((query) => (
            <div key={query.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {query.query_type}
                  </Badge>
                  <Badge className={getStatusColor(query.status) + " text-white text-xs"}>
                    {query.status}
                  </Badge>
                </div>
                <p className="font-medium text-sm">{query.query_text}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(query.created_at).toLocaleDateString()} at{' '}
                  {new Date(query.created_at).toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuerySelected(query.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}