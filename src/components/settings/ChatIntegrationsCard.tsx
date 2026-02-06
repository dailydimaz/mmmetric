import { useState } from "react";
import { MessageSquare, Trash2, TestTube, Loader2, ExternalLink, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSlackIntegration, isValidSlackWebhookUrl } from "@/hooks/useSlackIntegration";
import { useDiscordIntegration, isValidDiscordWebhookUrl } from "@/hooks/useDiscordIntegration";
import { useToast } from "@/hooks/use-toast";

interface ChatIntegrationsCardProps {
  siteId: string;
}

type Platform = 'slack' | 'discord';

interface NotifySettings {
  daily_digest: boolean;
  weekly_digest: boolean;
  goal_completed: boolean;
  traffic_spike: boolean;
  alert_triggered?: boolean;
}

export function ChatIntegrationsCard({ siteId }: ChatIntegrationsCardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Platform>('slack');
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelName, setChannelName] = useState("");

  // Slack hook
  const slackHook = useSlackIntegration(siteId);
  // Discord hook
  const discordHook = useDiscordIntegration(siteId);

  const isLoading = slackHook.isLoading || discordHook.isLoading;

  const getIntegration = (platform: Platform) => 
    platform === 'slack' ? slackHook.integration : discordHook.integration;

  const getHook = (platform: Platform) => 
    platform === 'slack' ? slackHook : discordHook;

  const validateWebhookUrl = (platform: Platform, url: string): boolean => {
    if (platform === 'slack') return isValidSlackWebhookUrl(url);
    return isValidDiscordWebhookUrl(url);
  };

  const handleSetup = async (platform: Platform) => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Webhook URL required",
        description: `Please enter your ${platform === 'slack' ? 'Slack' : 'Discord'} webhook URL`,
        variant: "destructive",
      });
      return;
    }

    if (!validateWebhookUrl(platform, webhookUrl)) {
      toast({
        title: "Invalid webhook URL",
        description: `Please enter a valid ${platform === 'slack' ? 'Slack' : 'Discord'} webhook URL`,
        variant: "destructive",
      });
      return;
    }

    try {
      const hook = getHook(platform);
      await hook.setupIntegration.mutateAsync({
        webhookUrl,
        channelName: channelName || undefined,
      });
      toast({
        title: "Connected",
        description: `${platform === 'slack' ? 'Slack' : 'Discord'} integration set up successfully`,
      });
      setWebhookUrl("");
      setChannelName("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set up integration",
        variant: "destructive",
      });
    }
  };

  const handleTest = async (platform: Platform) => {
    try {
      const hook = getHook(platform);
      await hook.testWebhook.mutateAsync();
      toast({
        title: "Test sent",
        description: `Check your ${platform === 'slack' ? 'Slack' : 'Discord'} channel for the test message`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test message",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (platform: Platform) => {
    try {
      const hook = getHook(platform);
      await hook.removeIntegration.mutateAsync();
      toast({
        title: "Removed",
        description: `${platform === 'slack' ? 'Slack' : 'Discord'} integration has been removed`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove integration",
        variant: "destructive",
      });
    }
  };

  const handleNotifyToggle = async (platform: Platform, key: string, value: boolean) => {
    try {
      const hook = getHook(platform);
      await hook.updateSettings.mutateAsync({
        notifyOn: { [key]: value },
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const renderConnectedState = (platform: Platform) => {
    const integration = getIntegration(platform);
    const hook = getHook(platform);
    if (!integration) return null;

    const notifyOn = integration.notify_on as NotifySettings;

    return (
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="font-medium">Connected</span>
            {integration.channel_name && (
              <span className="text-muted-foreground">
                to #{integration.channel_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTest(platform)}
              disabled={hook.testWebhook.isPending}
            >
              {hook.testWebhook.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-1" />
              )}
              Test
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => handleRemove(platform)}
              disabled={hook.removeIntegration.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Notification Settings
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Summary</p>
                <p className="text-sm text-muted-foreground">
                  Receive a daily digest of your analytics at 9 AM
                </p>
              </div>
              <Switch
                checked={notifyOn.daily_digest}
                onCheckedChange={(v) => handleNotifyToggle(platform, 'daily_digest', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary every Monday
                </p>
              </div>
              <Switch
                checked={notifyOn.weekly_digest}
                onCheckedChange={(v) => handleNotifyToggle(platform, 'weekly_digest', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Goal Completed</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when a goal is achieved
                </p>
              </div>
              <Switch
                checked={notifyOn.goal_completed}
                onCheckedChange={(v) => handleNotifyToggle(platform, 'goal_completed', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Traffic Spike</p>
                <p className="text-sm text-muted-foreground">
                  Alert when traffic is unusually high
                </p>
              </div>
              <Switch
                checked={notifyOn.traffic_spike}
                onCheckedChange={(v) => handleNotifyToggle(platform, 'traffic_spike', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alert Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when custom alerts are triggered
                </p>
              </div>
              <Switch
                checked={notifyOn.alert_triggered ?? true}
                onCheckedChange={(v) => handleNotifyToggle(platform, 'alert_triggered', v)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSetupState = (platform: Platform) => {
    const hook = getHook(platform);
    const platformName = platform === 'slack' ? 'Slack' : 'Discord';
    const webhookDocsUrl = platform === 'slack' 
      ? 'https://api.slack.com/messaging/webhooks'
      : 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks';
    const placeholder = platform === 'slack'
      ? 'https://hooks.slack.com/services/...'
      : 'https://discord.com/api/webhooks/...';

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${platform}-webhookUrl`}>{platformName} Webhook URL</Label>
          <Input
            id={`${platform}-webhookUrl`}
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder={placeholder}
          />
          <p className="text-xs text-muted-foreground">
            <a 
              href={webhookDocsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              How to get a webhook URL <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${platform}-channelName`}>Channel Name (optional)</Label>
          <Input
            id={`${platform}-channelName`}
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="e.g., analytics"
          />
        </div>
        <Button 
          onClick={() => handleSetup(platform)} 
          disabled={hook.setupIntegration.isPending}
        >
          {hook.setupIntegration.isPending ? "Connecting..." : `Connect ${platformName}`}
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const slackConnected = !!slackHook.integration;
  const discordConnected = !!discordHook.integration;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Team Chat Notifications
        </CardTitle>
        <CardDescription>
          Receive daily summaries and alert notifications in Slack or Discord
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Platform)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="slack" className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
              Slack
              {slackConnected && <Badge variant="secondary" className="ml-1 text-[10px]">Connected</Badge>}
            </TabsTrigger>
            <TabsTrigger value="discord" className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
              {discordConnected && <Badge variant="secondary" className="ml-1 text-[10px]">Connected</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slack" className="mt-6">
            {slackConnected ? renderConnectedState('slack') : renderSetupState('slack')}
          </TabsContent>

          <TabsContent value="discord" className="mt-6">
            {discordConnected ? renderConnectedState('discord') : renderSetupState('discord')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
