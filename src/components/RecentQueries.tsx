import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const clearAllQueries = async () => {
    if (!user || deleting) return;
    
    setDeleting(true);
    try {
      // Delete all related data first (due to foreign key relationships)
      const queryIds = queries.map(q => q.id);
      
      if (queryIds.length > 0) {
        // Delete related data
        await Promise.all([
          supabase.from('sentiment_analysis').delete().in('query_id', queryIds),
          supabase.from('competitor_data').delete().in('query_id', queryIds),
          supabase.from('trend_data').delete().in('query_id', queryIds),
          supabase.from('research_reports').delete().in('query_id', queryIds)
        ]);

        // Delete the queries
        const { error } = await supabase
          .from('research_queries')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      }

      setQueries([]);
      toast({
        title: "History Cleared",
        description: "All research queries and associated data have been deleted.",
      });
    } catch (error) {
      console.error('Error clearing queries:', error);
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
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
          {queries.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAllQueries}
              disabled={deleting}
              className="ml-auto h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Clear all history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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