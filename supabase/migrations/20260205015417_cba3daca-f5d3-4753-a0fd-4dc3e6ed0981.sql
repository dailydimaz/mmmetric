-- Add tracking_tier column to sites table
-- Allows users to choose between lite, standard, or full tracking scripts

ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS tracking_tier TEXT NOT NULL DEFAULT 'standard' 
CHECK (tracking_tier IN ('lite', 'standard', 'full'));