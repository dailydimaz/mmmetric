-- Fix search_path for get_shared_insight function
CREATE OR REPLACE FUNCTION public.get_shared_insight(_share_token TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  filters JSONB,
  date_range JSONB,
  widgets JSONB,
  site_id UUID
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id, i.name, i.description, i.filters, i.date_range, i.widgets, i.site_id
  FROM public.insights i
  WHERE i.share_token = _share_token AND i.is_public = true;
END;
$$;