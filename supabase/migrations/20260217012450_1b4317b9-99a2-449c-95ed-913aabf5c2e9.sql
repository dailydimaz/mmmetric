-- Add language column to events table and all partition tables
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS language TEXT;
