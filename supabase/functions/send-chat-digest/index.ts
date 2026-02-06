import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// This function is designed to be called by a cron job to send daily/weekly digests
// to Slack and Discord integrations

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Verify cron secret
    const providedCronSecret = req.headers.get('x-cron-secret');
    if (!cronSecret || providedCronSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const digestType = body.type || 'daily'; // 'daily' or 'weekly'

    console.log(`Starting ${digestType} digest job`);

    // Get all sites with active Slack or Discord integrations that have digests enabled
    const { data: slackIntegrations } = await supabase
      .from('slack_integrations')
      .select('site_id, notify_on')
      .eq('is_active', true);

    const { data: discordIntegrations } = await supabase
      .from('discord_integrations')
      .select('site_id, notify_on')
      .eq('is_active', true);

    // Combine and dedupe site IDs that need digests
    const siteIdsToNotify = new Set<string>();

    for (const integration of slackIntegrations || []) {
      const notifyOn = integration.notify_on || {};
      if ((digestType === 'daily' && notifyOn.daily_digest) ||
          (digestType === 'weekly' && notifyOn.weekly_digest)) {
        siteIdsToNotify.add(integration.site_id);
      }
    }

    for (const integration of discordIntegrations || []) {
      const notifyOn = integration.notify_on || {};
      if ((digestType === 'daily' && notifyOn.daily_digest) ||
          (digestType === 'weekly' && notifyOn.weekly_digest)) {
        siteIdsToNotify.add(integration.site_id);
      }
    }

    console.log(`Found ${siteIdsToNotify.size} sites to notify`);

    const results: Array<{ siteId: string; success: boolean; error?: string }> = [];

    // Calculate date ranges
    const now = new Date();
    const daysBack = digestType === 'daily' ? 1 : 7;
    
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysBack);

    for (const siteId of siteIdsToNotify) {
      try {
        // Get site stats
        const { data: stats } = await supabase.rpc('get_site_stats', {
          _site_id: siteId,
          _start_date: startDate.toISOString(),
          _end_date: endDate.toISOString(),
          _prev_start_date: prevStartDate.toISOString(),
          _prev_end_date: prevEndDate.toISOString(),
          _filters: {},
        });

        const stat = stats?.[0] || {};

        // Get top pages
        const { data: topPages } = await supabase.rpc('get_top_pages', {
          _site_id: siteId,
          _start_date: startDate.toISOString(),
          _end_date: endDate.toISOString(),
          _limit: 5,
          _filters: {},
        });

        const digestData = {
          visitors: Number(stat.unique_visitors) || 0,
          pageviews: Number(stat.total_pageviews) || 0,
          bounceRate: Number(stat.bounce_rate) || 0,
          avgDuration: stat.avg_session_duration || '0s',
          visitorsChange: Number(stat.visitors_change) || 0,
          pageviewsChange: Number(stat.pageviews_change) || 0,
          topPages: (topPages || []).map((p: any) => ({
            url: p.url,
            views: Number(p.pageviews) || 0,
          })),
        };

        // Call chat-notify to send the digest
        const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/chat-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': cronSecret || '',
          },
          body: JSON.stringify({
            siteId,
            type: digestType === 'daily' ? 'daily_digest' : 'weekly_digest',
            data: digestData,
            cronJob: true,
          }),
        });

        if (!notifyResponse.ok) {
          const errorText = await notifyResponse.text();
          console.error(`Failed to send digest for site ${siteId}:`, errorText);
          results.push({ siteId, success: false, error: errorText });
        } else {
          console.log(`Successfully sent ${digestType} digest for site ${siteId}`);
          results.push({ siteId, success: true });
        }
      } catch (err) {
        console.error(`Error processing site ${siteId}:`, err);
        results.push({ siteId, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(JSON.stringify({
      success: true,
      digestType,
      sitesProcessed: siteIdsToNotify.size,
      successCount,
      failedCount: results.length - successCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('send-chat-digest error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
