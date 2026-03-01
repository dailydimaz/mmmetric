
-- Add explicit RLS policies to all event partition tables to match parent (events_partitioned)
-- This won't affect SECURITY DEFINER RPCs (public dashboards) or service_role (tracking ingestion)

DO $$
DECLARE
  partition_name TEXT;
BEGIN
  FOR partition_name IN
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND (tablename LIKE 'events_y%' OR tablename = 'events_default')
  LOOP
    -- INSERT: Anyone can insert if site exists
    EXECUTE format(
      'CREATE POLICY "Anyone can insert %1$s" ON public.%1$I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = %1$I.site_id))',
      partition_name
    );

    -- SELECT: Site owners
    EXECUTE format(
      'CREATE POLICY "Users can view %1$s" ON public.%1$I FOR SELECT USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = %1$I.site_id AND sites.user_id = auth.uid()))',
      partition_name
    );

    -- SELECT: Team members
    EXECUTE format(
      'CREATE POLICY "Team members can view %1$s" ON public.%1$I FOR SELECT USING (EXISTS (SELECT 1 FROM team_members WHERE team_members.site_id = %1$I.site_id AND team_members.user_id = auth.uid()))',
      partition_name
    );

    -- DELETE: Site owners
    EXECUTE format(
      'CREATE POLICY "Site owners can delete %1$s" ON public.%1$I FOR DELETE USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = %1$I.site_id AND sites.user_id = auth.uid()))',
      partition_name
    );

    -- DELETE: Team admins
    EXECUTE format(
      'CREATE POLICY "Team admins can delete %1$s" ON public.%1$I FOR DELETE USING (has_team_role(site_id, ''admin''::text))',
      partition_name
    );
  END LOOP;
END $$;
