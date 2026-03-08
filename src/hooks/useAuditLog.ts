import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

export function useAuditLog(siteId?: string, limit = 50) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['audit-log', siteId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_log', {
        p_site_id: siteId || null,
        p_limit: limit,
        p_offset: 0,
      } as any);
      if (error) throw error;
      return (data || []) as unknown as AuditLogEntry[];
    },
    enabled: !!user,
  });

  const logAction = useMutation({
    mutationFn: async (params: { action: string; entityType: string; entityId?: string; siteId?: string; details?: any }) => {
      const { error } = await supabase.rpc('log_audit_action', {
        p_action: params.action,
        p_entity_type: params.entityType,
        p_entity_id: params.entityId || null,
        p_site_id: params.siteId || null,
        p_details: params.details || {},
      } as any);
      if (error) throw error;
    },
  });

  return {
    entries: query.data || [],
    isLoading: query.isLoading,
    logAction,
    refetch: query.refetch,
  };
}
