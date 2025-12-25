-- Add email preferences columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_digest boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails boolean DEFAULT false;

-- Create backup_codes table for 2FA recovery
CREATE TABLE public.backup_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used boolean DEFAULT false,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on backup_codes
ALTER TABLE public.backup_codes ENABLE ROW LEVEL SECURITY;

-- Policies for backup_codes
CREATE POLICY "Users can view own backup codes"
ON public.backup_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backup codes"
ON public.backup_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backup codes"
ON public.backup_codes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backup codes"
ON public.backup_codes FOR DELETE
USING (auth.uid() = user_id);

-- Create login_history table
CREATE TABLE public.login_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  browser text,
  os text,
  device_type text,
  country text,
  city text,
  success boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on login_history
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Policies for login_history
CREATE POLICY "Users can view own login history"
ON public.login_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login history"
ON public.login_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_created_at ON public.login_history(created_at DESC);
CREATE INDEX idx_backup_codes_user_id ON public.backup_codes(user_id);