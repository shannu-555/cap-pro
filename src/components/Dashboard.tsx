import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardHome } from '@/components/DashboardHome';
import { SearchForm } from '@/components/SearchForm';
import { ResearchResults } from '@/components/ResearchResults';
import { RecentQueries } from '@/components/RecentQueries';
import { ComparisonDashboard } from '@/components/ComparisonDashboard';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { Settings } from '@/components/Settings';
import { AlertsSystem } from '@/components/AlertsSystem';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQueryGenerated = (queryId: string) => {
    setCurrentQueryId(queryId);
    setActiveTab('research');
  };

  const handleComparisonRequest = () => {
    setActiveTab('comparison');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome onNavigate={setActiveTab} />;
      case 'research':
        return (
          <div className="space-y-8">
            <SearchForm onQuerySubmitted={setCurrentQueryId} />
            {currentQueryId && <ResearchResults queryId={currentQueryId} />}
            <RecentQueries onQuerySelected={setCurrentQueryId} />
          </div>
        );
      case 'comparison':
        return <ComparisonDashboard />;
      case 'assistant':
        return (
          <VoiceAssistant 
            onQueryGenerated={handleQueryGenerated}
            onComparisonRequested={handleComparisonRequest}
          />
        );
      case 'reports':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Reports Coming Soon</h2>
            <p className="text-muted-foreground">PDF report generation and history will be available here.</p>
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return <DashboardHome onNavigate={setActiveTab} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card/50 backdrop-blur-xl flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              {user?.email && (
                <p className="text-sm text-muted-foreground">
                  Welcome, {user.email}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <AlertsSystem />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="hover:shadow-soft transition-smooth"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}