import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// AES-256-GCM decryption
async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret).slice(0, 32),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function decrypt(ciphertext: string, secret: string): Promise<string> {
  const key = await getEncryptionKey(secret);
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (!encryptionKey || encryptionKey.length < 32) {
      return new Response(JSON.stringify({ error: 'Server encryption not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth: either user JWT or cron secret
    const authHeader = req.headers.get('Authorization');
    const providedCronSecret = req.headers.get('x-cron-secret');
    let userId: string | null = null;
    let isCron = false;

    if (providedCronSecret && cronSecret && providedCronSecret === cronSecret) {
      isCron = true;
    } else if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await anonClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { siteId } = body;

    // Get integrations to sync
    let query = supabase
      .from('integrations')
      .select('site_id, access_token, metadata')
      .eq('provider', 'shopify')
      .eq('is_active', true);

    if (siteId && !isCron) {
      query = query.eq('site_id', siteId);
    }

    const { data: integrations, error: intError } = await query;
    if (intError) throw intError;

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No active Shopify integrations' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If user-triggered, verify ownership
    if (!isCron && userId) {
      for (const integration of integrations) {
        const { data: site } = await supabase
          .from('sites')
          .select('user_id')
          .eq('id', integration.site_id)
          .single();

        if (!site || site.user_id !== userId) {
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('role')
            .eq('site_id', integration.site_id)
            .eq('user_id', userId)
            .eq('role', 'admin')
            .single();

          if (!teamMember) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    }

    const results: Array<{ siteId: string; success: boolean; ordersImported?: number; error?: string }> = [];

    for (const integration of integrations) {
      try {
        const metadata = integration.metadata as Record<string, unknown>;
        if (!metadata?.encrypted || !metadata?.shop_domain) {
          results.push({ siteId: integration.site_id, success: false, error: 'Invalid integration metadata' });
          continue;
        }

        const accessToken = await decrypt(integration.access_token, encryptionKey);
        const shopDomain = metadata.shop_domain as string;

        // Get last sync time for incremental sync
        const { data: existingIntegration } = await supabase
          .from('integrations')
          .select('last_sync_at')
          .eq('site_id', integration.site_id)
          .eq('provider', 'shopify')
          .single();

        const sinceDate = existingIntegration?.last_sync_at
          ? new Date(existingIntegration.last_sync_at).toISOString()
          : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // Default: last 90 days

        // Fetch orders from Shopify
        let allOrders: any[] = [];
        let pageInfo: string | null = null;
        let hasNextPage = true;

        while (hasNextPage && allOrders.length < 1000) {
          const url = new URL(`https://${shopDomain}/admin/api/2024-01/orders.json`);
          url.searchParams.set('status', 'any');
          url.searchParams.set('limit', '250');
          url.searchParams.set('updated_at_min', sinceDate);
          url.searchParams.set('fields', 'id,name,total_price,currency,financial_status,email,line_items,discount_codes,total_shipping_price_set,total_tax,created_at');

          if (pageInfo) {
            url.searchParams.set('page_info', pageInfo);
          }

          const res = await fetch(url.toString(), {
            headers: { 'X-Shopify-Access-Token': accessToken },
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error(`Shopify API error for site ${integration.site_id}:`, res.status, errText);

            // If 401, mark integration as inactive
            if (res.status === 401) {
              await supabase
                .from('integrations')
                .update({ is_active: false, metadata: { ...metadata, error: 'Invalid credentials' } })
                .eq('site_id', integration.site_id)
                .eq('provider', 'shopify');
            }

            results.push({ siteId: integration.site_id, success: false, error: `Shopify API ${res.status}` });
            hasNextPage = false;
            continue;
          }

          const data = await res.json();
          allOrders = allOrders.concat(data.orders || []);

          // Check for pagination
          const linkHeader = res.headers.get('Link');
          if (linkHeader && linkHeader.includes('rel="next"')) {
            const match = linkHeader.match(/<[^>]*page_info=([^>&]*).*?rel="next"/);
            pageInfo = match ? match[1] : null;
            hasNextPage = !!pageInfo;
          } else {
            hasNextPage = false;
          }
        }

        // Upsert orders
        if (allOrders.length > 0) {
          const ordersToUpsert = allOrders.map((order: any) => ({
            site_id: integration.site_id,
            shopify_order_id: String(order.id),
            order_number: order.name || null,
            amount: parseFloat(order.total_price) || 0,
            currency: order.currency || 'USD',
            status: order.financial_status || 'unknown',
            customer_email: order.email || null,
            line_items: order.line_items || [],
            discount_codes: order.discount_codes || [],
            shipping_total: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
            tax_total: parseFloat(order.total_tax || '0'),
            order_created_at: order.created_at,
          }));

          // Batch upsert in chunks of 100
          for (let i = 0; i < ordersToUpsert.length; i += 100) {
            const chunk = ordersToUpsert.slice(i, i + 100);
            const { error: upsertError } = await supabase
              .from('shopify_orders')
              .upsert(chunk, { onConflict: 'site_id,shopify_order_id' });

            if (upsertError) {
              console.error(`Upsert error for site ${integration.site_id}:`, upsertError);
            }
          }
        }

        // Update last_sync_at
        await supabase
          .from('integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('site_id', integration.site_id)
          .eq('provider', 'shopify');

        results.push({ siteId: integration.site_id, success: true, ordersImported: allOrders.length });
        console.log(`Synced ${allOrders.length} orders for site ${integration.site_id}`);
      } catch (err) {
        console.error(`Error syncing site ${integration.site_id}:`, err);
        results.push({ siteId: integration.site_id, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('shopify-sync error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
