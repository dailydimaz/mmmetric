import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// S3-compatible client for R3/R2/S3
async function uploadToR3(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string,
  key: string,
  body: string,
  contentType = 'application/json'
): Promise<{ url: string; size: number }> {
  const region = Deno.env.get('R3_REGION') || 'auto';
  const date = new Date();
  const dateStr = date.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8);
  const dateTimeStr = date.toISOString().replace(/[:-]|\.\d{3}/g, '');

  // AWS Signature V4
  const encoder = new TextEncoder();

  async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key instanceof Uint8Array ? key : new Uint8Array(key),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  }

  async function sha256(data: string): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const payloadHash = await sha256(body);
  const host = new URL(endpoint).host;
  const path = `/${bucket}/${key}`;

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateTimeStr}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = `PUT\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStr}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${dateTimeStr}\n${credentialScope}\n${await sha256(canonicalRequest)}`;

  const kDate = await hmac(encoder.encode(`AWS4${secretKey}`), dateStr);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');
  const signatureBuffer = await hmac(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `${endpoint}${path}`;
  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': dateTimeStr,
      'Authorization': authorization,
    },
    body,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`R3 upload failed (${resp.status}): ${errText}`);
  }

  return { url: `${endpoint}/${bucket}/${key}`, size: encoder.encode(body).length };
}

// Generate a pre-signed GET URL for R3
async function getPresignedUrl(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string,
  key: string,
  expiresIn = 3600
): Promise<string> {
  const region = Deno.env.get('R3_REGION') || 'auto';
  const date = new Date();
  const dateStr = date.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8);
  const dateTimeStr = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const encoder = new TextEncoder();

  async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key instanceof Uint8Array ? key : new Uint8Array(key),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  }

  async function sha256(data: string): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const host = new URL(endpoint).host;
  const path = `/${bucket}/${key}`;
  const credentialScope = `${dateStr}/${region}/s3/aws4_request`;
  const credential = `${accessKey}/${credentialScope}`;

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': dateTimeStr,
    'X-Amz-Expires': expiresIn.toString(),
    'X-Amz-SignedHeaders': 'host',
  });

  const canonicalRequest = `GET\n${path}\n${queryParams.toString()}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const stringToSign = `AWS4-HMAC-SHA256\n${dateTimeStr}\n${credentialScope}\n${await sha256(canonicalRequest)}`;

  const kDate = await hmac(encoder.encode(`AWS4${secretKey}`), dateStr);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');
  const signatureBuffer = await hmac(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  queryParams.set('X-Amz-Signature', signature);
  return `${endpoint}${path}?${queryParams.toString()}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const r3Endpoint = Deno.env.get('R3_ENDPOINT');
  const r3AccessKey = Deno.env.get('R3_ACCESS_KEY');
  const r3SecretKey = Deno.env.get('R3_SECRET_KEY');
  const r3Bucket = Deno.env.get('R3_BUCKET');

  if (!r3Endpoint || !r3AccessKey || !r3SecretKey || !r3Bucket) {
    return new Response(JSON.stringify({ error: 'Session recordings require R3 bucket configuration (self-hosted only)' }), {
      status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // GET: retrieve a recording's presigned URL for playback
    if (req.method === 'GET' && action === 'playback') {
      const recordingId = url.searchParams.get('id');
      if (!recordingId) {
        return new Response(JSON.stringify({ error: 'Missing recording id' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Auth check
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey, {
        global: { headers: { Authorization: authHeader } }
      });

      // RLS will enforce ownership check
      const { data: recording, error } = await userClient
        .from('session_recordings')
        .select('recording_url')
        .eq('id', recordingId)
        .single();

      if (error || !recording?.recording_url) {
        return new Response(JSON.stringify({ error: 'Recording not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Extract key from URL
      const r3Url = new URL(recording.recording_url);
      const key = r3Url.pathname.replace(`/${r3Bucket}/`, '');

      const presignedUrl = await getPresignedUrl(r3Endpoint, r3AccessKey, r3SecretKey, r3Bucket, key);

      return new Response(JSON.stringify({ url: presignedUrl }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: upload recording events
    if (req.method === 'POST') {
      const body = await req.json();
      const { site_id, session_id, visitor_id, events, metadata } = body;

      if (!site_id || !session_id || !events?.length) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify site exists
      const { data: site } = await supabase
        .from('sites')
        .select('id')
        .eq('tracking_id', site_id)
        .maybeSingle();

      if (!site) {
        return new Response(JSON.stringify({ error: 'Invalid site_id' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const now = new Date();
      const datePrefix = now.toISOString().slice(0, 10);
      const objectKey = `recordings/${site.id}/${datePrefix}/${session_id}.json`;

      // Check if recording already exists (append scenario)
      const { data: existing } = await supabase
        .from('session_recordings')
        .select('id, page_count, pages')
        .eq('site_id', site.id)
        .eq('session_id', session_id)
        .maybeSingle();

      // Upload to R3
      const recordingData = JSON.stringify({ events, metadata, timestamp: now.toISOString() });
      const { url: r3ObjectUrl, size } = await uploadToR3(
        r3Endpoint, r3AccessKey, r3SecretKey, r3Bucket, objectKey, recordingData
      );

      if (existing) {
        // Update existing recording
        const pages = Array.from(new Set([...(existing.pages || []), ...(metadata?.pages || [])]));
        await supabase
          .from('session_recordings')
          .update({
            ended_at: now.toISOString(),
            duration_seconds: metadata?.duration || null,
            page_count: pages.length,
            pages,
            recording_url: r3ObjectUrl,
            recording_size_bytes: size,
            status: 'completed',
          })
          .eq('id', existing.id);
      } else {
        // Create new recording entry
        await supabase
          .from('session_recordings')
          .insert({
            site_id: site.id,
            visitor_id: visitor_id || 'unknown',
            session_id,
            started_at: now.toISOString(),
            ended_at: now.toISOString(),
            duration_seconds: metadata?.duration || 0,
            page_count: metadata?.pages?.length || 1,
            pages: metadata?.pages || [metadata?.url || '/'],
            country: metadata?.country || null,
            city: metadata?.city || null,
            browser: metadata?.browser || null,
            os: metadata?.os || null,
            device_type: metadata?.device_type || null,
            recording_url: r3ObjectUrl,
            recording_size_bytes: size,
            status: 'completed',
          });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Session recording error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
