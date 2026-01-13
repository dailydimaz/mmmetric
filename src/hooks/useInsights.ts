import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface InsightFilters {
  country?: string;
  browser?: string;
  os?: string;
  device?: string;
  url?: string;
  referrerPattern?: string;
}

export interface InsightDateRange {
  preset?: string;
  startDate?: string;
  endDate?: string;
}

export interface Insight {
  id: string;
  site_id: string;
  user_id: string;
  name: string;
  description: string | null;
  filters: InsightFilters;
  date_range: InsightDateRange;
  widgets: string[];
  share_token: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to convert InsightFilters to Json
function filtersToJson(filters: InsightFilters): Json {
  return filters as unknown as Json;
}

// Helper to convert InsightDateRange to Json
function dateRangeToJson(dateRange: InsightDateRange): Json {
  return dateRange as unknown as Json;
}

// Helper to convert string array to Json
function widgetsToJson(widgets: string[]): Json {
  return widgets as unknown as Json;
}

export function useInsights(siteId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights", siteId],
    queryFn: async () => {
      if (!siteId) return [];
      const { data, error } = await supabase
        .from("insights")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((row) => ({
        ...row,
        filters: (row.filters || {}) as InsightFilters,
        date_range: (row.date_range || { preset: "7d" }) as InsightDateRange,
        widgets: (row.widgets || []) as string[],
      })) as Insight[];
    },
    enabled: !!siteId,
  });

  const createInsight = useMutation({
    mutationFn: async (insight: {
      site_id: string;
      name: string;
      description?: string;
      filters?: InsightFilters;
      date_range?: InsightDateRange;
      widgets?: string[];
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("insights")
        .insert({
          site_id: insight.site_id,
          user_id: user.user.id,
          name: insight.name,
          description: insight.description,
          filters: filtersToJson(insight.filters || {}),
          date_range: dateRangeToJson(insight.date_range || { preset: "7d" }),
          widgets: widgetsToJson(insight.widgets || ["visitors", "pageviews", "top_pages"]),
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        filters: (data.filters || {}) as InsightFilters,
        date_range: (data.date_range || { preset: "7d" }) as InsightDateRange,
        widgets: (data.widgets || []) as string[],
      } as Insight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights", siteId] });
      toast.success("Insight created");
    },
    onError: (error) => {
      toast.error("Failed to create insight: " + error.message);
    },
  });

  const updateInsight = useMutation({
    mutationFn: async ({
      id,
      filters,
      date_range,
      widgets,
      ...rest
    }: Partial<Insight> & { id: string }) => {
      const updates: Record<string, unknown> = { ...rest };
      if (filters) updates.filters = filtersToJson(filters);
      if (date_range) updates.date_range = dateRangeToJson(date_range);
      if (widgets) updates.widgets = widgetsToJson(widgets);

      const { data, error } = await supabase
        .from("insights")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        filters: (data.filters || {}) as InsightFilters,
        date_range: (data.date_range || { preset: "7d" }) as InsightDateRange,
        widgets: (data.widgets || []) as string[],
      } as Insight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights", siteId] });
      toast.success("Insight updated");
    },
    onError: (error) => {
      toast.error("Failed to update insight: " + error.message);
    },
  });

  const deleteInsight = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insights").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights", siteId] });
      toast.success("Insight deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete insight: " + error.message);
    },
  });

  const togglePublic = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const { data, error } = await supabase
        .from("insights")
        .update({ is_public: isPublic })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        filters: (data.filters || {}) as InsightFilters,
        date_range: (data.date_range || { preset: "7d" }) as InsightDateRange,
        widgets: (data.widgets || []) as string[],
      } as Insight;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["insights", siteId] });
      toast.success(data.is_public ? "Insight is now public" : "Insight is now private");
    },
    onError: (error) => {
      toast.error("Failed to update visibility: " + error.message);
    },
  });

  return {
    insights,
    isLoading,
    createInsight,
    updateInsight,
    deleteInsight,
    togglePublic,
  };
}

export function useSharedInsight(shareToken: string | undefined) {
  return useQuery({
    queryKey: ["shared-insight", shareToken],
    queryFn: async () => {
      if (!shareToken) return null;
      const { data, error } = await supabase
        .rpc("get_shared_insight", { _share_token: shareToken });

      if (error) throw error;
      if (!data || data.length === 0) return null;
      const row = data[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        filters: (row.filters || {}) as InsightFilters,
        date_range: (row.date_range || { preset: "7d" }) as InsightDateRange,
        widgets: (row.widgets || []) as string[],
        site_id: row.site_id,
      };
    },
    enabled: !!shareToken,
  });
}
