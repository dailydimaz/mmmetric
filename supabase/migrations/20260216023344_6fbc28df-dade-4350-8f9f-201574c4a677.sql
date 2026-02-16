
-- Create alert_history table to log triggered alerts
CREATE TABLE public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  metric_value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  comparison TEXT NOT NULL,
  metric TEXT NOT NULL,
  channel TEXT NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- Users can only view alert history for sites they own
CREATE POLICY "Users can view their alert history"
  ON public.alert_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites s
      WHERE s.id = alert_history.site_id
      AND s.user_id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX idx_alert_history_site_id ON public.alert_history(site_id);
CREATE INDEX idx_alert_history_alert_id ON public.alert_history(alert_id);
CREATE INDEX idx_alert_history_created_at ON public.alert_history(created_at DESC);
