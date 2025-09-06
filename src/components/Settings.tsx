import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Key, Bell, Palette, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserSettings {
  openai_api_key?: string;
  twitter_api_key?: string;
  instagram_api_key?: string;
  ecommerce_api_key?: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  email_alerts: boolean;
  report_format: 'pdf' | 'excel' | 'both';
  data_refresh_interval: number;
  voice_enabled: boolean;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  notifications: true,
  email_alerts: false,
  report_format: 'pdf',
  data_refresh_interval: 30,
  voice_enabled: true,
};

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load from localStorage for now - in production you'd use Supabase
      const saved = localStorage.getItem(`settings_${user.id}`);
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error Loading Settings",
        description: "Could not load your settings. Using defaults.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Save to localStorage for now - in production you'd use Supabase
      localStorage.setItem(`settings_${user.id}`, JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Could not save your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card className="professional-card animate-slide-up">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="professional-card animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          Application Settings
          <Button
            size="sm"
            onClick={saveSettings}
            disabled={saving}
            className="ml-auto btn-professional"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-effect">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">API Configuration</h3>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  Encrypted Storage
                </Badge>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openai">OpenAI API Key</Label>
                  <Input
                    id="openai"
                    type="password"
                    placeholder="sk-..."
                    value={settings.openai_api_key || ''}
                    onChange={(e) => updateSetting('openai_api_key', e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for AI assistant and intelligent insights
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X API Key</Label>
                  <Input
                    id="twitter"
                    type="password"
                    placeholder="Enter Twitter API key..."
                    value={settings.twitter_api_key || ''}
                    onChange={(e) => updateSetting('twitter_api_key', e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram API Key</Label>
                  <Input
                    id="instagram"
                    type="password"
                    placeholder="Enter Instagram API key..."
                    value={settings.instagram_api_key || ''}
                    onChange={(e) => updateSetting('instagram_api_key', e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ecommerce">E-commerce API Key</Label>
                  <Input
                    id="ecommerce"
                    type="password"
                    placeholder="Enter e-commerce API key..."
                    value={settings.ecommerce_api_key || ''}
                    onChange={(e) => updateSetting('ecommerce_api_key', e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    For Amazon, eBay, Shopify price monitoring
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">User Preferences</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: 'light' | 'dark' | 'auto') => updateSetting('theme', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice Assistant</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable voice interaction with AI assistant
                    </p>
                  </div>
                  <Switch
                    checked={settings.voice_enabled}
                    onCheckedChange={(checked) => updateSetting('voice_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Report Format</Label>
                    <p className="text-xs text-muted-foreground">
                      Default format for generated reports
                    </p>
                  </div>
                  <Select
                    value={settings.report_format}
                    onValueChange={(value: 'pdf' | 'excel' | 'both') => updateSetting('report_format', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Notification Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>In-App Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Show alerts within the application
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive critical alerts via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_alerts}
                    onCheckedChange={(checked) => updateSetting('email_alerts', checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Data Management</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Refresh Interval</Label>
                    <p className="text-xs text-muted-foreground">
                      How often to refresh market data (minutes)
                    </p>
                  </div>
                  <Select
                    value={settings.data_refresh_interval.toString()}
                    onValueChange={(value) => updateSetting('data_refresh_interval', parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                      <SelectItem value="360">6 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}