-- Create Annotations table
CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  annotation_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_annotations_site_id ON public.annotations(site_id);
CREATE INDEX idx_annotations_date ON public.annotations(site_id, annotation_date DESC);

-- Enable RLS
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Annotations policies
CREATE POLICY "Users can view annotations for own sites" ON public.annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = annotations.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create annotations" ON public.annotations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = annotations.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own annotations" ON public.annotations
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete own annotations" ON public.annotations
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Trigger for updated_at
CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON public.annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
