import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// Helper to send chat notifications
async function sendChatNotification(
    supabase: any,
    siteId: string,
    type: string,
    data: any
) {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const cronSecret = Deno.env.get('CRON_SECRET');

        const response = await fetch(`${supabaseUrl}/functions/v1/chat-notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-secret': cronSecret || '',
            },
            body: JSON.stringify({
                siteId,
                type,
                data,
                cronJob: true,
            }),
        });

        if (!response.ok) {
            console.error(`Failed to send chat notification: ${response.status}`);
        } else {
            console.log(`Chat notification sent for ${type} on site ${siteId}`);
        }
    } catch (err) {
        console.error('Error sending chat notification:', err);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const results: Array<{ alert: string; triggered: boolean; value: number; type: string }> = [];

        // ============ STANDARD ALERTS ============
        const { data: alerts, error: alertsError } = await supabase
            .from('alerts')
            .select('*, sites(id, domain, name)')
            .eq('is_enabled', true);

        if (alertsError) throw alertsError;

        for (const alert of alerts || []) {
            if (!alert.sites) continue;

            // Time range: last hour
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);

            // Fetch metric
            let value = 0;
            if (alert.metric === 'visitors') {
                const { count } = await supabase
                    .from('events')
                    .select('visitor_id', { count: 'exact', head: true })
                    .eq('site_id', alert.site_id)
                    .gte('created_at', startDate.toISOString())
                    .lt('created_at', endDate.toISOString());
                value = count || 0;
            } else if (alert.metric === 'pageviews') {
                const { count } = await supabase
                    .from('events')
                    .select('id', { count: 'exact', head: true })
                    .eq('site_id', alert.site_id)
                    .eq('event_name', 'pageview')
                    .gte('created_at', startDate.toISOString())
                    .lt('created_at', endDate.toISOString());
                value = count || 0;
            }

            // Check condition
            const isTriggered =
                (alert.comparison === 'gt' && value > alert.threshold) ||
                (alert.comparison === 'lt' && value < alert.threshold);

            if (isTriggered) {
                console.log(`Alert triggered: ${alert.name} for ${alert.sites.name}. Value: ${value}, Threshold: ${alert.threshold}`);

                await supabase
                    .from('alerts')
                    .update({ last_triggered_at: new Date().toISOString() })
                    .eq('id', alert.id);

                results.push({ alert: alert.name, triggered: true, value, type: 'standard' });

                // Send chat notification for triggered alerts
                const condition = `${alert.metric} ${alert.comparison === 'gt' ? '>' : '<'} ${alert.threshold}`;
                await sendChatNotification(supabase, alert.site_id, 'alert_triggered', {
                    alertName: alert.name,
                    condition,
                    currentValue: value,
                    threshold: alert.threshold,
                    metric: alert.metric,
                });
            }
        }

        // ============ CONTENT DECAY ALERTS ============
        const { data: monitors, error: monitorsError } = await supabase
            .from('content_decay_monitors')
            .select('*, sites:site_id(id, name, domain, user_id)')
            .eq('is_enabled', true);

        if (monitorsError) {
            console.error('Error fetching content decay monitors:', monitorsError);
        }

        for (const monitor of monitors || []) {
            if (!monitor.sites) continue;

            // Don't alert more than once per day for the same page
            if (monitor.last_alert_at) {
                const lastAlert = new Date(monitor.last_alert_at);
                const hoursSinceLastAlert = (Date.now() - lastAlert.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastAlert < 24) continue;
            }

            // Get current pageviews for this URL in the last 7 days
            const { count: currentPageviews } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .eq('site_id', monitor.site_id)
                .eq('event_name', 'pageview')
                .eq('url', monitor.url)
                .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

            const current = currentPageviews || 0;
            const baseline = monitor.baseline_pageviews || 0;

            // Calculate decay percentage
            let decayPercent = 0;
            if (baseline > 0) {
                decayPercent = Math.max(0, Math.round(100 - (current * 100 / baseline)));
            }

            // Determine status
            let status = 'healthy';
            if (decayPercent >= monitor.decay_threshold_percent) {
                status = 'declining';
            } else if (decayPercent >= monitor.decay_threshold_percent / 2) {
                status = 'warning';
            }

            // Update monitor with current stats
            await supabase
                .from('content_decay_monitors')
                .update({
                    current_decay_percent: decayPercent,
                    status,
                    last_checked_at: new Date().toISOString(),
                })
                .eq('id', monitor.id);

            // Check if we need to trigger an alert
            const isDecaying = decayPercent >= monitor.decay_threshold_percent;

            if (isDecaying) {
                console.log(`Content decay detected: ${monitor.url} on ${monitor.sites.name}. Decay: ${decayPercent}%, Threshold: ${monitor.decay_threshold_percent}%`);

                // Update last alert time
                await supabase
                    .from('content_decay_monitors')
                    .update({ last_alert_at: new Date().toISOString() })
                    .eq('id', monitor.id);

                results.push({
                    alert: `Content decay: ${monitor.url}`,
                    triggered: true,
                    value: decayPercent,
                    type: 'content_decay'
                });

                // Send chat notification for content decay
                await sendChatNotification(supabase, monitor.site_id, 'alert_triggered', {
                    alertName: `Content Decay: ${monitor.url}`,
                    condition: `Traffic dropped ${decayPercent}% (threshold: ${monitor.decay_threshold_percent}%)`,
                    currentValue: current,
                    baseline: baseline,
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            checked: {
                standard_alerts: alerts?.length || 0,
                content_decay_monitors: monitors?.length || 0
            },
            triggered: results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('check-alerts error:', errorMessage);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
