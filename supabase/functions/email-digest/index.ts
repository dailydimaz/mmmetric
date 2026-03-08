import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  // Allow cron secret OR anon key auth
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAnon = anonKey && authHeader === `Bearer ${anonKey}`;
  
  if (!isCron && !isAnon) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM') || 'MMmetric <noreply@mmmetric.com>';

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get all sites with their owners who have email digests enabled
    // For now, send to all site owners (could add a preference column later)
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, domain, user_id');

    if (sitesError) throw sitesError;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let emailsSent = 0;

    for (const site of (sites || [])) {
      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(site.user_id);
      if (!userData?.user?.email) continue;

      // Get current week stats
      const { data: currentStats } = await (supabase.rpc as any)('get_site_stats', {
        _site_id: site.id,
        _start_date: weekAgo.toISOString(),
        _end_date: now.toISOString(),
        _prev_start_date: twoWeeksAgo.toISOString(),
        _prev_end_date: weekAgo.toISOString(),
      });

      const stats = (currentStats as any)?.[0] || {};
      const pageviews = Number(stats.total_pageviews) || 0;
      const visitors = Number(stats.unique_visitors) || 0;
      const pvChange = Number(stats.pageviews_change) || 0;
      const visChange = Number(stats.visitors_change) || 0;
      const bounceRate = Number(stats.bounce_rate) || 0;

      // Get top pages
      const { data: topPages } = await (supabase.rpc as any)('get_top_pages', {
        _site_id: site.id,
        _start_date: weekAgo.toISOString(),
        _end_date: now.toISOString(),
        _limit: 5,
      });

      // Get top referrers
      const { data: topReferrers } = await (supabase.rpc as any)('get_top_referrers', {
        _site_id: site.id,
        _start_date: weekAgo.toISOString(),
        _end_date: now.toISOString(),
        _limit: 5,
      });

      const pvChangeStr = pvChange >= 0 ? `+${pvChange.toFixed(1)}%` : `${pvChange.toFixed(1)}%`;
      const visChangeStr = visChange >= 0 ? `+${visChange.toFixed(1)}%` : `${visChange.toFixed(1)}%`;
      const pvColor = pvChange >= 0 ? '#22c55e' : '#ef4444';
      const visColor = visChange >= 0 ? '#22c55e' : '#ef4444';

      const pagesHtml = (topPages || []).slice(0, 5).map((p: any) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${p.url || '/'}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:600;">${p.pageviews}</td></tr>`
      ).join('');

      const refsHtml = (topReferrers || []).slice(0, 5).map((r: any) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${r.referrer || 'Direct'}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:600;">${r.visits}</td></tr>`
      ).join('');

      const weekStart = weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekEnd = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">📊 Weekly Report</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${site.name} · ${weekStart} – ${weekEnd}</p>
    </div>
    
    <div style="padding:24px 32px;">
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#111;">${pageviews.toLocaleString()}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">Pageviews</div>
          <div style="font-size:12px;color:${pvColor};font-weight:600;margin-top:4px;">${pvChangeStr} vs prev week</div>
        </div>
        <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#111;">${visitors.toLocaleString()}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">Visitors</div>
          <div style="font-size:12px;color:${visColor};font-weight:600;margin-top:4px;">${visChangeStr} vs prev week</div>
        </div>
        <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#111;">${bounceRate.toFixed(0)}%</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">Bounce Rate</div>
        </div>
      </div>

      ${pagesHtml ? `
      <h3 style="font-size:14px;font-weight:600;color:#374151;margin:24px 0 8px;">Top Pages</h3>
      <table style="width:100%;border-collapse:collapse;"><tbody>${pagesHtml}</tbody></table>
      ` : ''}

      ${refsHtml ? `
      <h3 style="font-size:14px;font-weight:600;color:#374151;margin:24px 0 8px;">Top Referrers</h3>
      <table style="width:100%;border-collapse:collapse;"><tbody>${refsHtml}</tbody></table>
      ` : ''}
    </div>

    <div style="padding:16px 32px;background:#f9fafb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Sent by MMmetric · <a href="https://mmmetric.lovable.app" style="color:#6366f1;">View Dashboard</a></p>
    </div>
  </div>
</div>
</body>
</html>`;

      // Send via Resend
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [userData.user.email],
            subject: `📊 ${site.name} — Weekly Report (${weekStart} – ${weekEnd})`,
            html,
          }),
        });

        if (res.ok) {
          emailsSent++;
        } else {
          const errText = await res.text();
          console.error(`Failed to send digest to ${userData.user.email}:`, errText);
        }
      } catch (e) {
        console.error('Resend API error:', e);
      }
    }

    return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Email digest error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
