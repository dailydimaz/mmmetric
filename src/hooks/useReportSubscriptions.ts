import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ReportSubscription {
  id: string;
  site_id: string;
  report_id: string | null;
  dashboard_id: string | null;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week: number;
  day_of_month: number;
  hour_of_day: number;
  timezone: string;
  channel: string;
  channel_config: any;
  is_enabled: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
  created_at: string;
}

export function useReportSubscriptions(siteId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['report-subscriptions', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_subscriptions')
        .select('*')
        .eq('site_id', siteId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReportSubscription[];
    },
    enabled: !!siteId && !!user,
  });

  const createSubscription = useMutation({
    mutationFn: async (sub: Omit<ReportSubscription, 'id' | 'created_at' | 'last_sent_at' | 'next_send_at' | 'site_id'>) => {
      if (!user || !siteId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('report_subscriptions')
        .insert({ user_id: user.id, site_id: siteId, ...sub } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-subscriptions', siteId] }),
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ReportSubscription>) => {
      const { error } = await supabase
        .from('report_subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-subscriptions', siteId] }),
  });

  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('report_subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-subscriptions', siteId] }),
  });

  return {
    subscriptions: query.data || [],
    isLoading: query.isLoading,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  };
}
