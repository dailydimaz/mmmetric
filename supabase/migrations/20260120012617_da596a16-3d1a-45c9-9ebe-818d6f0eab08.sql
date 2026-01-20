-- Add DELETE policy for events_partitioned to allow site owners to delete events
-- This addresses the security warning about missing DELETE policies

-- Site owners can delete events for their sites
CREATE POLICY "Site owners can delete events_partitioned"
  ON public.events_partitioned
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM sites
    WHERE sites.id = events_partitioned.site_id
    AND sites.user_id = auth.uid()
  ));

-- Team admins can delete events for their assigned sites  
CREATE POLICY "Team admins can delete events_partitioned"
  ON public.events_partitioned
  FOR DELETE
  USING (has_team_role(site_id, 'admin'::text));