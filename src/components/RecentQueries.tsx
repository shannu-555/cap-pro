import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Eye, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
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
    
    setDeleting('all');
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
      setDeleting(null);
    }
  };

  const deleteQuery = async (queryId: string) => {
    if (!user || deleting) return;

    setDeleting(queryId);
    try {
      // Delete related data first
      await Promise.all([
        supabase.from('sentiment_analysis').delete().eq('query_id', queryId),
        supabase.from('competitor_data').delete().eq('query_id', queryId),
        supabase.from('trend_data').delete().eq('query_id', queryId),
        supabase.from('research_reports').delete().eq('query_id', queryId)
      ]);

      // Delete the research query
      const { error } = await supabase
        .from('research_queries')
        .delete()
        .eq('id', queryId);

      if (error) throw error;

      setQueries(prev => prev.filter(q => q.id !== queryId));
      toast({
        title: "Query deleted",
        description: "Research query and all related data have been deleted.",
      });
    } catch (error) {
      console.error('Error deleting query:', error);
      toast({
        title: "Error",
        description: "Failed to delete query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteClick = (queryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueryToDelete(queryId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (queryToDelete) {
      deleteQuery(queryToDelete);
      setQueryToDelete(null);
    }
    setShowDeleteDialog(false);
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
              onClick={() => setShowClearAllDialog(true)}
              disabled={deleting === 'all'}
              className="ml-auto h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Clear all history"
            >
              {deleting === 'all' ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {queries.map((query) => (
            <div key={query.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-soft transition-all group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {query.query_type}
                  </Badge>
                  <Badge 
                    className={`text-xs ${
                      query.status === 'completed' ? 'status-completed' :
                      query.status === 'processing' ? 'status-active' :
                      query.status === 'failed' ? 'status-failed' : 'status-pending'
                    }`}
                  >
                    {query.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(query.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="font-medium text-sm truncate">{query.query_text}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuerySelected(query.id)}
                  className="hover:shadow-soft transition-smooth"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleDeleteClick(query.id, e)}
                  disabled={deleting === query.id}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-smooth"
                >
                  {deleting === query.id ? (
                    <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Query"
          description="Are you sure you want to delete this query? All related data including competitor analysis, sentiment data, and reports will be permanently deleted."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          variant="destructive"
        />

        <ConfirmDialog
          open={showClearAllDialog}
          onOpenChange={setShowClearAllDialog}
          title="Clear All Queries"
          description="Are you sure you want to clear all research queries? This will permanently delete all your research data, competitor analysis, sentiment data, and reports."
          confirmText="Clear All"
          cancelText="Cancel"
          onConfirm={() => {
            clearAllQueries();
            setShowClearAllDialog(false);
          }}
          variant="destructive"
        />
      </CardContent>
    </Card>
  );
}