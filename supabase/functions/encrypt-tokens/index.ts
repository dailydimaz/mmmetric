import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// AES-256-GCM encryption (same as shopify-connect)
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

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await getEncryptionKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

function isEncrypted(token: string): boolean {
  // Encrypted tokens are base64 and start with IV bytes - they're always longer
  // and don't look like typical OAuth tokens (which are alphanumeric with dots/dashes)
  try {
    const decoded = atob(token);
    // Must be at least 12 (IV) + 16 (min ciphertext + tag) bytes
    return decoded.length >= 28;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth: require cron secret or service role JWT
    const incomingSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');
    
    if (incomingSecret !== cronSecret) {
      // Fallback: check if it's a service role JWT
      if (!authHeader?.includes(supabaseServiceKey)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!encryptionKey || encryptionKey.length < 32) {
      return new Response(JSON.stringify({ error: 'ENCRYPTION_KEY not configured or too short' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all integrations with non-null tokens
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('id, provider, access_token, refresh_token, metadata')
      .or('access_token.not.is.null,refresh_token.not.is.null');

    if (error) throw error;

    let encrypted = 0;
    let skipped = 0;

    for (const integration of integrations || []) {
      // Skip if already encrypted (metadata.encrypted === true)
      const meta = (integration.metadata as Record<string, unknown>) || {};
      if (meta.encrypted === true) {
        skipped++;
        continue;
      }

      const updates: Record<string, unknown> = {};

      if (integration.access_token && !isEncrypted(integration.access_token)) {
        updates.access_token = await encrypt(integration.access_token, encryptionKey);
      }

      if (integration.refresh_token && !isEncrypted(integration.refresh_token)) {
        updates.refresh_token = await encrypt(integration.refresh_token, encryptionKey);
      }

      if (Object.keys(updates).length > 0) {
        updates.metadata = { ...meta, encrypted: true };
        const { error: updateError } = await supabase
          .from('integrations')
          .update(updates)
          .eq('id', integration.id);

        if (updateError) {
          console.error(`Failed to encrypt tokens for integration ${integration.id}:`, updateError.message);
        } else {
          encrypted++;
        }
      } else {
        // Mark as encrypted even if tokens were already in encrypted format
        await supabase
          .from('integrations')
          .update({ metadata: { ...meta, encrypted: true } })
          .eq('id', integration.id);
        skipped++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      encrypted,
      skipped,
      total: (integrations || []).length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('encrypt-tokens error:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
