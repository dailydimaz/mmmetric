import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ContentDecayMonitor {
  id: string;
  site_id: string;
  url: string;
  baseline_pageviews: number;
  baseline_visitors: number;
  baseline_period_start: string | null;
  baseline_period_end: string | null;
  decay_threshold_percent: number;
  comparison_period_days: number;
  is_enabled: boolean;
  last_checked_at: string | null;
  last_alert_at: string | null;
  current_decay_percent: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DecayCheckResult {
  monitor_id: string;
  url: string;
  baseline_pageviews: number;
  current_pageviews: number;
  decay_percent: number;
  threshold_percent: number;
  is_decaying: boolean;
}

export function useContentDecayMonitors(siteId: string) {
  return useQuery({
    queryKey: ["content-decay-monitors", siteId],
    queryFn: async (): Promise<ContentDecayMonitor[]> => {
      const { data, error } = await supabase
        .from("content_decay_monitors")
        .select("*")
        .eq("site_id", siteId)
        .order("baseline_pageviews", { ascending: false });

      if (error) throw error;
      return data as ContentDecayMonitor[];
    },
    enabled: !!siteId,
  });
}

export function useCheckContentDecay(siteId: string) {
  return useQuery({
    queryKey: ["content-decay-check", siteId],
    queryFn: async (): Promise<DecayCheckResult[]> => {
      const { data, error } = await supabase.rpc("check_content_decay", {
        p_site_id: siteId,
      });

      if (error) throw error;
      return (data || []) as DecayCheckResult[];
    },
    enabled: !!siteId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function useSetupContentDecayMonitors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      siteId,
      topN = 10,
      threshold = 30,
    }: {
      siteId: string;
      topN?: number;
      threshold?: number;
    }) => {
      const { data, error } = await supabase.rpc("setup_content_decay_monitors", {
        p_site_id: siteId,
        p_top_n: topN,
        p_decay_threshold: threshold,
      });

      if (error) throw error;
      return data as number;
    },
    onSuccess: (count, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: ["content-decay-monitors", siteId] });
      queryClient.invalidateQueries({ queryKey: ["content-decay-check", siteId] });
      toast({
        title: "Monitors Created",
        description: `Set up ${count} page monitors based on your top-performing content.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddContentDecayMonitor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      siteId,
      url,
      threshold = 30,
    }: {
      siteId: string;
      url: string;
      threshold?: number;
    }) => {
      // First get current baseline from last 30 days
      const { count: baseline } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("site_id", siteId)
        .eq("event_name", "pageview")
        .eq("url", url)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data, error } = await supabase
        .from("content_decay_monitors")
        .insert({
          site_id: siteId,
          url,
          baseline_pageviews: baseline || 0,
          baseline_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          baseline_period_end: new Date().toISOString(),
          decay_threshold_percent: threshold,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: ["content-decay-monitors", siteId] });
      toast({
        title: "Monitor Added",
        description: "Page is now being monitored for content decay.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteContentDecayMonitor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, siteId }: { id: string; siteId: string }) => {
      const { error } = await supabase
        .from("content_decay_monitors")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return siteId;
    },
    onSuccess: (siteId) => {
      queryClient.invalidateQueries({ queryKey: ["content-decay-monitors", siteId] });
      toast({
        title: "Monitor Removed",
        description: "Page monitor has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateContentDecayMonitor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      siteId,
      updates,
    }: {
      id: string;
      siteId: string;
      updates: Partial<Pick<ContentDecayMonitor, "decay_threshold_percent" | "is_enabled">>;
    }) => {
      const { error } = await supabase
        .from("content_decay_monitors")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      return siteId;
    },
    onSuccess: (siteId) => {
      queryClient.invalidateQueries({ queryKey: ["content-decay-monitors", siteId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
