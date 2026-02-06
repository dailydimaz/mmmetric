-- Create discord_integrations table (similar structure to slack_integrations)
CREATE TABLE IF NOT EXISTS public.discord_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    webhook_url TEXT NOT NULL,
    channel_name TEXT,
    notify_on JSONB NOT NULL DEFAULT '{"daily_digest": true, "weekly_digest": false, "goal_completed": true, "traffic_spike": false, "alert_triggered": true}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT discord_integrations_site_id_key UNIQUE (site_id)
);

-- Enable RLS
ALTER TABLE public.discord_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discord_integrations (matching slack_integrations pattern)
CREATE POLICY "Users can view their own discord integrations"
    ON public.discord_integrations
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        site_id IN (SELECT site_id FROM public.team_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own discord integrations"
    ON public.discord_integrations
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own discord integrations"
    ON public.discord_integrations
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own discord integrations"
    ON public.discord_integrations
    FOR DELETE
    USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_discord_integrations_updated_at
    BEFORE UPDATE ON public.discord_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add 'discord' to alert channels if not already present
DO $$ 
BEGIN
    -- Check if 'discord' is not already in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'discord' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'alert_channel')
    ) THEN
        ALTER TYPE public.alert_channel ADD VALUE IF NOT EXISTS 'discord';
    END IF;
END $$;