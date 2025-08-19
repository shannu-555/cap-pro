import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SearchForm } from '@/components/SearchForm';
import { ResearchResults } from '@/components/ResearchResults';
import { RecentQueries } from '@/components/RecentQueries';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Market Research AI</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user?.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <SearchForm onQuerySubmitted={setCurrentQueryId} />
        
        {currentQueryId && (
          <ResearchResults queryId={currentQueryId} />
        )}
        
        <RecentQueries onQuerySelected={setCurrentQueryId} />
      </main>
    </div>
  );
}