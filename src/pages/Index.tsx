import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold mb-4">Market Research AI</h1>
          <p className="text-xl text-muted-foreground mb-6">
            AI-powered market insights for e-commerce
          </p>
          <Button onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;
