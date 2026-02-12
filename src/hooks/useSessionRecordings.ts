import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionsUrl } from "@/lib/config";

export interface SessionRecording {
  id: string;
  site_id: string;
  visitor_id: string;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  page_count: number;
  pages: string[];
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  recording_url: string | null;
  recording_size_bytes: number | null;
  status: string;
  created_at: string;
}

export function useSessionRecordings(siteId: string) {
  return useQuery({
    queryKey: ['session-recordings', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_recordings')
        .select('*')
        .eq('site_id', siteId)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SessionRecording[];
    },
    enabled: !!siteId,
  });
}

export function useSessionRecordingPlayback() {
  return useMutation({
    mutationFn: async (recordingId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${getSupabaseFunctionsUrl()}/session-recording?action=playback&id=${recordingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get playback URL');
      }

      const { url } = await res.json();

      // Fetch the actual recording data
      const recordingRes = await fetch(url);
      if (!recordingRes.ok) throw new Error('Failed to fetch recording data');

      return recordingRes.json();
    },
  });
}

export function useDeleteSessionRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordingId: string) => {
      const { error } = await supabase
        .from('session_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-recordings'] });
    },
  });
}
