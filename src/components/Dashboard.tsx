import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SearchForm } from '@/components/SearchForm';
import { ResearchResults } from '@/components/ResearchResults';
import { RecentQueries } from '@/components/RecentQueries';
import { AlertsSystem } from '@/components/AlertsSystem';
import { ComparisonDashboard } from '@/components/ComparisonDashboard';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, Search, BarChart3, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
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
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Market Research AI
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <AlertsSystem queryId={currentQueryId || undefined} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user?.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="hover:shadow-soft transition-smooth">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Research
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="space-y-8">
            <SearchForm onQuerySubmitted={setCurrentQueryId} />
            
            {currentQueryId && (
              <ResearchResults queryId={currentQueryId} />
            )}
            
            <RecentQueries onQuerySelected={setCurrentQueryId} />
          </TabsContent>

          <TabsContent value="comparison">
            <ComparisonDashboard />
          </TabsContent>

          <TabsContent value="assistant">
            <VoiceAssistant 
              onQueryGenerated={setCurrentQueryId}
              onComparisonRequested={() => setShowComparison(true)}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}