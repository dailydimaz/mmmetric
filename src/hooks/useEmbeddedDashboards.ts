import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EmbeddedDashboardToken {
  id: string;
  site_id: string;
  dashboard_id: string | null;
  name: string;
  allowed_domains: string[];
  expires_at: string | null;
  is_active: boolean;
  settings: any;
  created_at: string;
}

export function useEmbeddedDashboards(siteId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['embedded-dashboard-tokens', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embedded_dashboard_tokens')
        .select('*')
        .eq('site_id', siteId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EmbeddedDashboardToken[];
    },
    enabled: !!siteId && !!user,
  });

  const createToken = useMutation({
    mutationFn: async (params: {
      name: string;
      dashboard_id?: string;
      allowed_domains?: string[];
      expires_at?: string;
      settings?: any;
    }) => {
      if (!user || !siteId) throw new Error('Not authenticated');
      
      // Generate a random token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Hash it for storage
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      const { data, error } = await supabase
        .from('embedded_dashboard_tokens')
        .insert({
          user_id: user.id,
          site_id: siteId,
          token_hash: tokenHash,
          name: params.name,
          dashboard_id: params.dashboard_id || null,
          allowed_domains: params.allowed_domains || [],
          expires_at: params.expires_at || null,
          settings: params.settings || {},
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { ...data, plainToken: token };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['embedded-dashboard-tokens', siteId] }),
  });

  const deleteToken = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('embedded_dashboard_tokens').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['embedded-dashboard-tokens', siteId] }),
  });

  const toggleToken = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('embedded_dashboard_tokens')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['embedded-dashboard-tokens', siteId] }),
  });

  return {
    tokens: query.data || [],
    isLoading: query.isLoading,
    createToken,
    deleteToken,
    toggleToken,
  };
}
