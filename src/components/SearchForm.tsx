import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SearchFormProps {
  onQuerySubmitted: (queryId: string) => void;
}

export function SearchForm({ onQuerySubmitted }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState<'product' | 'company'>('product');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to perform market research.",
        variant: "destructive",
      });
      return;
    }

    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
        // Create the research query record
        const { data, error } = await supabase
          .from('research_queries')
          .insert({
            user_id: user.id,
            query_text: query.trim(),
            query_type: queryType,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Research Started",
          description: `Analyzing ${queryType}: "${query}". Our AI agents are now working on your request.`,
        });

        onQuerySubmitted(data.id);
        setQuery('');

        // Trigger the research controller to start all agents
        try {
          const { error: controllerError } = await supabase.functions.invoke('research-controller', {
            body: { queryId: data.id }
          });

          if (controllerError) {
            console.error('Error triggering research controller:', controllerError);
            toast({
              title: "Processing Started",
              description: "Research query created, agents will begin processing shortly.",
            });
          }
        } catch (controllerError) {
          console.error('Failed to trigger research controller:', controllerError);
          toast({
            title: "Processing Delayed",
            description: "Query saved successfully. Processing may take longer than usual.",
            variant: "destructive",
          });
        }
    } catch (error: any) {
      console.error('Error creating research query:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start research. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          AI Market Research
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Select value={queryType} onValueChange={(value: 'product' | 'company') => setQueryType(value)}>
              <SelectTrigger className="w-32 glass-effect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Enter ${queryType} name to research...`}
              className="flex-1 glass-effect"
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="btn-professional px-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Our AI agents will analyze sentiment, competitor data, and market trends to provide comprehensive insights.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}