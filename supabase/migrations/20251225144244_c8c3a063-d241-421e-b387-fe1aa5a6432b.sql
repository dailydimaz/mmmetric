-- Drop existing restrictive policies on api_keys table
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;

-- Ensure RLS is enabled
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well (prevents bypassing RLS)
ALTER TABLE public.api_keys FORCE ROW LEVEL SECURITY;

-- Create proper PERMISSIVE policies (default behavior, explicitly stated for clarity)
CREATE POLICY "Users can view own API keys"
ON public.api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
ON public.api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
ON public.api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
ON public.api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);