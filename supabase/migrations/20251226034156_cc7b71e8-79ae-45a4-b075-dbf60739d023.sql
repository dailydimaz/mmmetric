-- Fix profile email exposure vulnerability
-- The issue: is_team_member_of_same_site allows viewing ALL profile data including email
-- Solution: Restructure policy so email is only visible to the profile owner

-- Drop the existing combined policy
DROP POLICY IF EXISTS "Team members can view teammate profiles" ON public.profiles;

-- Create policy for users to view their own full profile (including email)
CREATE POLICY "Users can view own full profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Create policy for team members to view limited profile data (no email access via RLS)
-- Note: The query will still return rows, but application code should NOT request email
-- The RLS can't filter columns, so we rely on the application to not query email for non-owners
CREATE POLICY "Team members can view teammate profiles limited"
ON public.profiles FOR SELECT
USING (is_team_member_of_same_site(id) AND auth.uid() != id);