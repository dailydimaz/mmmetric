-- Fix shopify_orders RLS: Add team member access and ensure service role can insert
-- Current policy only allows site owners to SELECT, but we need team admins to also view

-- Add policy for team admins to view shopify orders
CREATE POLICY "Team admins can view shopify orders"
ON public.shopify_orders
FOR SELECT
USING (has_team_role(site_id, 'admin'::text));

-- Add policy for service role to insert orders (from webhooks/edge functions)
-- Note: Service role bypasses RLS, but we add explicit INSERT policy for completeness
CREATE POLICY "System can insert shopify orders"
ON public.shopify_orders
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM sites WHERE sites.id = shopify_orders.site_id
));

-- Add policy for service role to update orders
CREATE POLICY "System can update shopify orders"
ON public.shopify_orders
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM sites WHERE sites.id = shopify_orders.site_id
));

-- Add delete policy for site owners only
CREATE POLICY "Site owners can delete shopify orders"
ON public.shopify_orders
FOR DELETE
USING (is_site_owner(site_id));