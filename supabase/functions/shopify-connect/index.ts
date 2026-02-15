import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AES-256-GCM encryption helpers
async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret).slice(0, 32),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return keyMaterial;
}

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await getEncryptionKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  // Combine IV + ciphertext, base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');

    if (!encryptionKey || encryptionKey.length < 32) {
      return new Response(JSON.stringify({ error: 'Server encryption not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

    const body = await req.json();
    const { siteId, shopDomain, accessToken, action } = body;

    if (!siteId) {
      return new Response(JSON.stringify({ error: 'siteId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user owns this site
    const { data: site } = await supabase
      .from('sites')
      .select('id, user_id')
      .eq('id', siteId)
      .single();

    if (!site || site.user_id !== user.id) {
      // Check team membership
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('site_id', siteId)
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!teamMember) {
        return new Response(JSON.stringify({ error: 'Forbidden: Must be site owner or admin' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle disconnect action
    if (action === 'disconnect') {
      const { error: deleteError } = await supabase
        .from('integrations')
        .delete()
        .eq('site_id', siteId)
        .eq('provider', 'shopify');

      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true, message: 'Shopify disconnected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate inputs for connect
    if (!shopDomain || !accessToken) {
      return new Response(JSON.stringify({ error: 'shopDomain and accessToken are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize shop domain
    const cleanDomain = shopDomain
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase();

    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(cleanDomain)) {
      return new Response(JSON.stringify({ error: 'Invalid Shopify domain. Must be yourstore.myshopify.com' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the API key works by calling Shopify
    const verifyRes = await fetch(`https://${cleanDomain}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error('Shopify API verification failed:', verifyRes.status, errText);
      return new Response(JSON.stringify({ error: 'Invalid Shopify credentials. Please check your domain and API key.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const shopData = await verifyRes.json();

    // Encrypt the access token
    const encryptedToken = await encrypt(accessToken, encryptionKey);

    // Upsert integration
    const { error: upsertError } = await supabase
      .from('integrations')
      .upsert({
        site_id: siteId,
        provider: 'shopify',
        access_token: encryptedToken,
        is_active: true,
        metadata: {
          shop_domain: cleanDomain,
          shop_name: shopData.shop?.name || cleanDomain,
          encrypted: true,
        },
        last_sync_at: null,
      }, {
        onConflict: 'site_id,provider',
      });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({
      success: true,
      shopName: shopData.shop?.name || cleanDomain,
      shopDomain: cleanDomain,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('shopify-connect error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
