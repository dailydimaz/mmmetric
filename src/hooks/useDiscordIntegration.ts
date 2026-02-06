import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Discord webhook URL validation regex
const DISCORD_WEBHOOK_REGEX = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/;

export function isValidDiscordWebhookUrl(url: string): boolean {
  return DISCORD_WEBHOOK_REGEX.test(url);
}

interface DiscordNotifySettings {
  daily_digest: boolean;
  weekly_digest: boolean;
  goal_completed: boolean;
  traffic_spike: boolean;
  alert_triggered: boolean;
}

interface DiscordIntegration {
  id: string;
  site_id: string;
  user_id: string;
  channel_name: string | null;
  notify_on: DiscordNotifySettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useDiscordIntegration(siteId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const integrationQuery = useQuery({
    queryKey: ['discord-integration', siteId],
    queryFn: async () => {
      if (!siteId || !user) return null;

      const { data, error } = await supabase
        .from('discord_integrations')
        .select('id, site_id, user_id, channel_name, notify_on, is_active, created_at, updated_at')
        .eq('site_id', siteId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          notify_on: (data.notify_on || {
            daily_digest: true,
            weekly_digest: false,
            goal_completed: true,
            traffic_spike: false,
            alert_triggered: true,
          }) as unknown as DiscordNotifySettings,
        } as DiscordIntegration;
      }
      return null;
    },
    enabled: !!siteId && !!user,
  });

  const setupIntegration = useMutation({
    mutationFn: async ({ 
      webhookUrl, 
      channelName,
      notifyOn 
    }: { 
      webhookUrl: string; 
      channelName?: string;
      notifyOn?: Partial<DiscordNotifySettings>;
    }) => {
      if (!user || !siteId) throw new Error('Not authenticated or no site selected');

      if (!isValidDiscordWebhookUrl(webhookUrl)) {
        throw new Error('Invalid Discord webhook URL format.');
      }

      const defaultNotifyOn: DiscordNotifySettings = {
        daily_digest: true,
        weekly_digest: false,
        goal_completed: true,
        traffic_spike: false,
        alert_triggered: true,
        ...notifyOn,
      };

      const { data, error } = await supabase
        .from('discord_integrations')
        .upsert({
          site_id: siteId,
          user_id: user.id,
          webhook_url: webhookUrl,
          channel_name: channelName || null,
          notify_on: defaultNotifyOn as unknown as any,
          is_active: true,
        } as any, {
          onConflict: 'site_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-integration', siteId] });
    },
  });

  const updateSettings = useMutation({
    mutationFn: async ({ 
      notifyOn,
      isActive 
    }: { 
      notifyOn?: Partial<DiscordNotifySettings>;
      isActive?: boolean;
    }) => {
      if (!user || !siteId) throw new Error('Not authenticated or no site selected');

      const currentData = integrationQuery.data;
      if (!currentData) throw new Error('No integration found');

      const updates: any = {};
      if (notifyOn) {
        updates.notify_on = { ...currentData.notify_on, ...notifyOn };
      }
      if (isActive !== undefined) {
        updates.is_active = isActive;
      }

      const { error } = await supabase
        .from('discord_integrations')
        .update(updates)
        .eq('site_id', siteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-integration', siteId] });
    },
  });

  const testWebhook = useMutation({
    mutationFn: async () => {
      if (!siteId) throw new Error('No site selected');

      const { data, error } = await supabase.functions.invoke('chat-notify', {
        body: { siteId, platform: 'discord', test: true },
      });

      if (error) throw error;
      return data;
    },
  });

  const removeIntegration = useMutation({
    mutationFn: async () => {
      if (!user || !siteId) throw new Error('Not authenticated or no site selected');

      const { error } = await supabase
        .from('discord_integrations')
        .delete()
        .eq('site_id', siteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord-integration', siteId] });
    },
  });

  return {
    integration: integrationQuery.data,
    isLoading: integrationQuery.isLoading,
    error: integrationQuery.error,
    setupIntegration,
    updateSettings,
    testWebhook,
    removeIntegration,
  };
}
