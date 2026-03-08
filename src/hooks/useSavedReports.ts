import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SavedReport {
  id: string;
  site_id: string;
  collection_id: string | null;
  name: string;
  description: string | null;
  query_config: any;
  visualization_type: string;
  visualization_config: any;
  is_pinned: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportCollection {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  color: string;
  icon: string;
  position: number;
  created_at: string;
}

export function useSavedReports(siteId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ['saved-reports', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .eq('site_id', siteId!)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as SavedReport[];
    },
    enabled: !!siteId && !!user,
  });

  const collectionsQuery = useQuery({
    queryKey: ['report-collections', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_collections')
        .select('*')
        .eq('site_id', siteId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as ReportCollection[];
    },
    enabled: !!siteId && !!user,
  });

  const saveReport = useMutation({
    mutationFn: async (report: {
      name: string;
      description?: string;
      query_config: any;
      visualization_type: string;
      visualization_config?: any;
      collection_id?: string;
    }) => {
      if (!user || !siteId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('saved_reports')
        .insert({
          user_id: user.id,
          site_id: siteId,
          ...report,
          visualization_config: report.visualization_config || {},
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-reports', siteId] }),
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<SavedReport>) => {
      const { error } = await supabase
        .from('saved_reports')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-reports', siteId] }),
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-reports', siteId] }),
  });

  const createCollection = useMutation({
    mutationFn: async (collection: { name: string; description?: string; color?: string; parent_id?: string }) => {
      if (!user || !siteId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('report_collections')
        .insert({ user_id: user.id, site_id: siteId, ...collection } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-collections', siteId] }),
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('report_collections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-collections', siteId] }),
  });

  return {
    reports: reportsQuery.data || [],
    collections: collectionsQuery.data || [],
    isLoading: reportsQuery.isLoading || collectionsQuery.isLoading,
    saveReport,
    updateReport,
    deleteReport,
    createCollection,
    deleteCollection,
  };
}
