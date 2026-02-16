import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const COOLDOWN_HOURS = 1; // Don't re-trigger same alert within 1 hour

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
            body: JSON.stringify({ siteId, type, data, cronJob: true }),
        });

        if (!response.ok) {
            console.error(`Failed to send chat notification: ${response.status}`);
        }
    } catch (err) {
        console.error('Error sending chat notification:', err);
    }
}

async function sendEmailNotification(
    resend: Resend | null,
    userEmail: string,
    alertName: string,
    siteName: string,
    metric: string,
    value: number,
    threshold: number,
    comparison: string,
    appName: string,
) {
    if (!resend) {
        console.warn('RESEND_API_KEY not configured, skipping email notification');
        return false;
    }

    const conditionText = comparison === 'gt' ? 'exceeded' : 'dropped below';
    const emailFrom = Deno.env.get('EMAIL_FROM') || `${appName} <alerts@mmmetric.com>`;

    try {
        await resend.emails.send({
            from: emailFrom,
            to: userEmail,
            subject: `🔔 Alert: ${alertName} — ${siteName}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                    <h2 style="margin: 0 0 16px;">Alert Triggered</h2>
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <p style="margin: 0 0 8px; font-weight: 600;">${alertName}</p>
                        <p style="margin: 0; color: #666;">Site: ${siteName}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Metric</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${metric}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Current Value</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${metric === 'bounce_rate' ? value.toFixed(1) + '%' : value}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Threshold</td>
                            <td style="padding: 8px 0; text-align: right;">${conditionText} ${metric === 'bounce_rate' ? threshold + '%' : threshold}</td>
                        </tr>
                    </table>
                    <p style="margin: 24px 0 0; font-size: 12px; color: #999;">
                        You're receiving this because you have alerts enabled on ${appName}.
                    </p>
                </div>
            `,
        });
        return true;
    } catch (err) {
        console.error('Failed to send alert email:', err);
        return false;
    }
}

async function logAlertHistory(
    supabase: any,
    alertId: string,
    siteId: string,
    value: number,
    threshold: number,
    comparison: string,
    metric: string,
    channel: string,
    notificationSent: boolean,
) {
    try {
        await supabase.from('alert_history').insert({
            alert_id: alertId,
            site_id: siteId,
            metric_value: value,
            threshold,
            comparison,
            metric,
            channel,
            notification_sent: notificationSent,
        });
    } catch (err) {
        console.error('Failed to log alert history:', err);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const cronSecret = Deno.env.get('CRON_SECRET');
        const resendKey = Deno.env.get('RESEND_API_KEY');
        const appName = Deno.env.get('APP_NAME') || 'mmmetric';

        const providedCronSecret = req.headers.get('x-cron-secret');
        if (!cronSecret || providedCronSecret !== cronSecret) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const resend = resendKey ? new Resend(resendKey) : null;

        const results: Array<{ alert: string; triggered: boolean; value: number; type: string }> = [];

        // ============ STANDARD ALERTS ============
        const { data: alerts, error: alertsError } = await supabase
            .from('alerts')
            .select('*, sites(id, domain, name, user_id)')
            .eq('is_enabled', true);

        if (alertsError) throw alertsError;

        for (const alert of alerts || []) {
            if (!alert.sites) continue;

            // Cooldown: skip if triggered recently
            if (alert.last_triggered_at) {
                const hoursSince = (Date.now() - new Date(alert.last_triggered_at).getTime()) / (1000 * 60 * 60);
                if (hoursSince < COOLDOWN_HOURS) continue;
            }

            // Time range: last hour
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);

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
            } else if (alert.metric === 'bounce_rate') {
                // Calculate bounce rate: sessions with only 1 pageview / total sessions
                const { data: sessionData } = await supabase
                    .from('events')
                    .select('session_id')
                    .eq('site_id', alert.site_id)
                    .eq('event_name', 'pageview')
                    .gte('created_at', startDate.toISOString())
                    .lt('created_at', endDate.toISOString());

                if (sessionData && sessionData.length > 0) {
                    const sessionCounts: Record<string, number> = {};
                    for (const e of sessionData) {
                        if (e.session_id) {
                            sessionCounts[e.session_id] = (sessionCounts[e.session_id] || 0) + 1;
                        }
                    }
                    const totalSessions = Object.keys(sessionCounts).length;
                    const bouncedSessions = Object.values(sessionCounts).filter(c => c === 1).length;
                    value = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;
                }
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

                let notificationSent = false;

                // Send notification based on channel
                if (alert.channel === 'email') {
                    // Get user email
                    const { data: userData } = await supabase.auth.admin.getUserById(alert.sites.user_id);
                    if (userData?.user?.email) {
                        notificationSent = await sendEmailNotification(
                            resend, userData.user.email, alert.name,
                            alert.sites.name, alert.metric, value,
                            alert.threshold, alert.comparison, appName
                        ) || false;
                    }
                } else if (alert.channel === 'slack' || alert.channel === 'webhook') {
                    const condition = `${alert.metric} ${alert.comparison === 'gt' ? '>' : '<'} ${alert.threshold}`;
                    await sendChatNotification(supabase, alert.site_id, 'alert_triggered', {
                        alertName: alert.name,
                        condition,
                        currentValue: value,
                        threshold: alert.threshold,
                        metric: alert.metric,
                    });
                    notificationSent = true;
                }

                // Log to alert_history
                await logAlertHistory(
                    supabase, alert.id, alert.site_id,
                    value, alert.threshold, alert.comparison,
                    alert.metric, alert.channel, notificationSent
                );

                results.push({ alert: alert.name, triggered: true, value, type: 'standard' });
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

            if (monitor.last_alert_at) {
                const lastAlert = new Date(monitor.last_alert_at);
                const hoursSinceLastAlert = (Date.now() - lastAlert.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastAlert < 24) continue;
            }

            const { count: currentPageviews } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .eq('site_id', monitor.site_id)
                .eq('event_name', 'pageview')
                .eq('url', monitor.url)
                .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

            const current = currentPageviews || 0;
            const baseline = monitor.baseline_pageviews || 0;

            let decayPercent = 0;
            if (baseline > 0) {
                decayPercent = Math.max(0, Math.round(100 - (current * 100 / baseline)));
            }

            let status = 'healthy';
            if (decayPercent >= monitor.decay_threshold_percent) {
                status = 'declining';
            } else if (decayPercent >= monitor.decay_threshold_percent / 2) {
                status = 'warning';
            }

            await supabase
                .from('content_decay_monitors')
                .update({
                    current_decay_percent: decayPercent,
                    status,
                    last_checked_at: new Date().toISOString(),
                })
                .eq('id', monitor.id);

            const isDecaying = decayPercent >= monitor.decay_threshold_percent;

            if (isDecaying) {
                console.log(`Content decay detected: ${monitor.url} on ${monitor.sites.name}. Decay: ${decayPercent}%`);

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
        console.error('check-alerts error:', error instanceof Error ? error.message : error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
