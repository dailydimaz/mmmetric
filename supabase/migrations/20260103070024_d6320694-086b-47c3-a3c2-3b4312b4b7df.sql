-- Fix: Team Member Email Exposure via RLS Policy
-- The issue is that team members can query ALL columns from profiles table for their teammates
-- Since Postgres RLS cannot filter columns, we'll use a SECURITY DEFINER function approach
-- and remove the overly permissive policy

-- Step 1: Drop the existing overly permissive policy that allows full row access
DROP POLICY IF EXISTS "Team members can view teammate profiles limited" ON public.profiles;

-- Step 2: Create a SECURITY DEFINER function that returns only safe profile data for team members
-- This function only returns non-sensitive fields (id, full_name, avatar_url)
CREATE OR REPLACE FUNCTION public.get_team_member_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = _user_id
    AND public.is_team_member_of_same_site(_user_id)
$$;

-- Note: The existing policy "Users can view own full profile" remains intact
-- This means:
-- 1. Users can see their own full profile (including email) via direct table access
-- 2. Team members must use the get_team_member_profile() function to view teammates
-- 3. Direct table queries to teammates' profiles will return no rows

-- The application code in useTeam.ts needs to be updated to use this function instead
-- of directly querying the profiles table for teammate data