-- Drop the ambiguous overloads, keep only the text-based one with password
DROP FUNCTION IF EXISTS public.get_public_dashboard_stats(text, text, text);
DROP FUNCTION IF EXISTS public.get_public_dashboard_stats(text, date, date, text);