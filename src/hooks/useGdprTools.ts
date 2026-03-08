import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useGdprLookup() {
  return useMutation({
    mutationFn: async ({ siteId, visitorId }: { siteId: string; visitorId: string }) => {
      const { data, error } = await (supabase.rpc as any)("gdpr_lookup_visitor", {
        _site_id: siteId,
        _visitor_id: visitorId,
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGdprDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, visitorId }: { siteId: string; visitorId: string }) => {
      const { data, error } = await (supabase.rpc as any)("gdpr_delete_visitor", {
        _site_id: siteId,
        _visitor_id: visitorId,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
