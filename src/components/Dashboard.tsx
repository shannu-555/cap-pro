import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SearchForm } from '@/components/SearchForm';
import { ResearchResults } from '@/components/ResearchResults';
import { RecentQueries } from '@/components/RecentQueries';
import { AlertsSystem } from '@/components/AlertsSystem';
import { ComparisonDashboard } from '@/components/ComparisonDashboard';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { Settings } from '@/components/Settings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, Search, BarChart3, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
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
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          {/* Centered Title */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Market Research AI
            </h1>
          </div>
          
          {/* User Info and Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                <User className="h-4 w-4" />
                {user?.email}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AlertsSystem queryId={currentQueryId || undefined} />
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hover:shadow-soft transition-smooth">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-effect">
            <TabsTrigger value="research" className="flex items-center gap-2 transition-smooth">
              <Search className="h-4 w-4" />
              Research
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2 transition-smooth">
              <BarChart3 className="h-4 w-4" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-2 transition-smooth">
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 transition-smooth">
              <SettingsIcon className="h-4 w-4" />
              Settings
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

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}