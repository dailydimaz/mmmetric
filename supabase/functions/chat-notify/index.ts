import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface NotificationMessage {
  text: string;
  blocks?: any[];
}

// Validate Webhook URL format (server-side validation)
const SLACK_WEBHOOK_REGEX = /^https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[a-zA-Z0-9]+$/;
const DISCORD_WEBHOOK_REGEX = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/;

function isValidWebhookUrl(url: string): boolean {
  return SLACK_WEBHOOK_REGEX.test(url) || DISCORD_WEBHOOK_REGEX.test(url);
}

function isDiscordWebhook(url: string): boolean {
  return DISCORD_WEBHOOK_REGEX.test(url);
}

// Sanitize user-controlled input
function sanitize(text: string | null | undefined, maxLength = 200): string {
  if (!text) return 'Unknown';
  let sanitized = text.substring(0, maxLength);
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return sanitized;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getChangeIndicator(change: number): string {
  if (change > 0) return `↑ ${change.toFixed(1)}%`;
  if (change < 0) return `↓ ${Math.abs(change).toFixed(1)}%`;
  return '→ 0%';
}

// Extract user ID from Authorization header
async function getUserIdFromRequest(req: Request, supabase: any): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Error getting user from token:', error);
    return null;
  }

  return user.id;
}

// Check if user has access to the site
async function userHasSiteAccess(supabase: any, userId: string, siteId: string): Promise<boolean> {
  const { data: site } = await supabase
    .from('sites')
    .select('user_id')
    .eq('id', siteId)
    .single();

  if (site?.user_id === userId) return true;

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!teamMember;
}

// Build notification messages
function buildTestMessage(siteName: string, domain: string): NotificationMessage {
  return {
    text: `🧪 Test notification from ${siteName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🧪 Test Notification*\n\nThis is a test message from your analytics dashboard.\n\n*Site:* ${siteName}\n*Domain:* ${domain || 'Not set'}`,
        },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Sent at ${new Date().toISOString()}` }],
      },
    ],
  };
}

function buildDailyDigestMessage(siteName: string, domain: string, data: any): NotificationMessage {
  const visitors = formatNumber(data?.visitors || 0);
  const pageviews = formatNumber(data?.pageviews || 0);
  const bounceRate = (data?.bounceRate || 0).toFixed(1);
  const avgDuration = data?.avgDuration || '0s';
  const visitorsChange = getChangeIndicator(data?.visitorsChange || 0);
  const pageviewsChange = getChangeIndicator(data?.pageviewsChange || 0);

  return {
    text: `📊 Daily Analytics Summary for ${siteName}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📊 Daily Analytics Summary' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${siteName}*\n${domain || 'No domain set'}`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Visitors*\n${visitors} (${visitorsChange})` },
          { type: 'mrkdwn', text: `*Page Views*\n${pageviews} (${pageviewsChange})` },
          { type: 'mrkdwn', text: `*Bounce Rate*\n${bounceRate}%` },
          { type: 'mrkdwn', text: `*Avg. Duration*\n${avgDuration}` },
        ],
      },
      ...(data?.topPages?.length > 0 ? [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Top Pages*\n${data.topPages.slice(0, 5).map((p: any, i: number) => 
            `${i + 1}. ${sanitize(p.url, 50)} — ${formatNumber(p.views)}`
          ).join('\n')}`,
        },
      }] : []),
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Report for ${new Date().toLocaleDateString()}` }],
      },
    ],
  };
}

function buildWeeklyDigestMessage(siteName: string, domain: string, data: any): NotificationMessage {
  const visitors = formatNumber(data?.visitors || 0);
  const pageviews = formatNumber(data?.pageviews || 0);
  const visitorsChange = getChangeIndicator(data?.visitorsChange || 0);
  const pageviewsChange = getChangeIndicator(data?.pageviewsChange || 0);

  return {
    text: `📈 Weekly Analytics Summary for ${siteName}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📈 Weekly Analytics Summary' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${siteName}*\n${domain || 'No domain set'}\n\nHere's your weekly performance summary:`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Total Visitors*\n${visitors} (${visitorsChange})` },
          { type: 'mrkdwn', text: `*Total Page Views*\n${pageviews} (${pageviewsChange})` },
        ],
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Week ending ${new Date().toLocaleDateString()}` }],
      },
    ],
  };
}

function buildGoalCompletedMessage(siteName: string, data: any): NotificationMessage {
  return {
    text: `🎯 Goal Achieved: ${sanitize(data?.goalName)}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🎯 Goal Achieved!*\n\n*Goal:* ${sanitize(data?.goalName)}\n*Conversions:* ${data?.conversions || 0}\n*Site:* ${siteName}`,
        },
      },
    ],
  };
}

function buildTrafficSpikeMessage(siteName: string, data: any): NotificationMessage {
  return {
    text: `🚀 Traffic Spike Detected on ${siteName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🚀 Traffic Spike Detected!*\n\n*Site:* ${siteName}\n*Current Visitors:* ${data?.currentVisitors || 0}\n*Normal Average:* ${data?.averageVisitors || 0}\n*Increase:* ${data?.increasePercent || 0}%`,
        },
      },
    ],
  };
}

function buildAlertTriggeredMessage(siteName: string, data: any): NotificationMessage {
  return {
    text: `⚠️ Alert Triggered: ${sanitize(data?.alertName)} on ${siteName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*⚠️ Alert Triggered*\n\n*Alert:* ${sanitize(data?.alertName)}\n*Condition:* ${sanitize(data?.condition)}\n*Current Value:* ${data?.currentValue || 0}\n*Site:* ${siteName}`,
        },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Triggered at ${new Date().toISOString()}` }],
      },
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const cronSecret = Deno.env.get('CRON_SECRET');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    const body = await req.json();
    const { siteId, platform, test, type, data, cronJob } = body;

    // Authentication
    if (cronJob) {
      const providedCronSecret = req.headers.get('x-cron-secret');
      if (!cronSecret || providedCronSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const userId = await getUserIdFromRequest(req, supabaseAuth);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (siteId) {
        const hasAccess = await userHasSiteAccess(supabaseAdmin, userId, siteId);
        if (!hasAccess) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    if (!siteId) {
      throw new Error('Site ID is required');
    }

    // Get site info
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('name, domain')
      .eq('id', siteId)
      .single();

    const siteName = sanitize(site?.name);
    const domain = sanitize(site?.domain);

    // Determine which platforms to notify
    const platformsToNotify: Array<{ platform: 'slack' | 'discord'; webhookUrl: string }> = [];

    if (!platform || platform === 'slack') {
      const { data: slackIntegration } = await supabaseAdmin
        .from('slack_integrations')
        .select('webhook_url, notify_on, is_active')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .maybeSingle();

      if (slackIntegration?.webhook_url) {
        const notifyOn = slackIntegration.notify_on || {};
        const shouldNotify = test || 
          (type === 'daily_digest' && notifyOn.daily_digest) ||
          (type === 'weekly_digest' && notifyOn.weekly_digest) ||
          (type === 'goal_completed' && notifyOn.goal_completed) ||
          (type === 'traffic_spike' && notifyOn.traffic_spike) ||
          (type === 'alert_triggered' && (notifyOn.alert_triggered ?? true));

        if (shouldNotify) {
          platformsToNotify.push({ platform: 'slack', webhookUrl: slackIntegration.webhook_url });
        }
      }
    }

    if (!platform || platform === 'discord') {
      const { data: discordIntegration } = await supabaseAdmin
        .from('discord_integrations')
        .select('webhook_url, notify_on, is_active')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .maybeSingle();

      if (discordIntegration?.webhook_url) {
        const notifyOn = discordIntegration.notify_on || {};
        const shouldNotify = test || 
          (type === 'daily_digest' && notifyOn.daily_digest) ||
          (type === 'weekly_digest' && notifyOn.weekly_digest) ||
          (type === 'goal_completed' && notifyOn.goal_completed) ||
          (type === 'traffic_spike' && notifyOn.traffic_spike) ||
          (type === 'alert_triggered' && (notifyOn.alert_triggered ?? true));

        if (shouldNotify) {
          platformsToNotify.push({ platform: 'discord', webhookUrl: discordIntegration.webhook_url });
        }
      }
    }

    if (platformsToNotify.length === 0) {
      throw new Error('No active integrations found for this site');
    }

    // Build message based on type
    let message: NotificationMessage;
    if (test) {
      message = buildTestMessage(siteName, domain);
    } else if (type === 'daily_digest') {
      message = buildDailyDigestMessage(siteName, domain, data);
    } else if (type === 'weekly_digest') {
      message = buildWeeklyDigestMessage(siteName, domain, data);
    } else if (type === 'goal_completed') {
      message = buildGoalCompletedMessage(siteName, data);
    } else if (type === 'traffic_spike') {
      message = buildTrafficSpikeMessage(siteName, data);
    } else if (type === 'alert_triggered') {
      message = buildAlertTriggeredMessage(siteName, data);
    } else {
      throw new Error('Unknown notification type');
    }

    // Send to all platforms
    const results: Array<{ platform: string; success: boolean; error?: string }> = [];

    for (const { platform: p, webhookUrl } of platformsToNotify) {
      if (!isValidWebhookUrl(webhookUrl)) {
        console.error(`Invalid webhook URL for ${p}`);
        results.push({ platform: p, success: false, error: 'Invalid webhook URL' });
        continue;
      }

      // Discord uses Slack compatibility mode
      const finalUrl = isDiscordWebhook(webhookUrl) && !webhookUrl.endsWith('/slack')
        ? `${webhookUrl}/slack`
        : webhookUrl;

      try {
        console.log(`Sending ${test ? 'test' : type} notification to ${p} for site ${siteId}`);

        const response = await fetch(finalUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${p} API error:`, errorText);
          results.push({ platform: p, success: false, error: `API error: ${response.status}` });
        } else {
          console.log(`Successfully sent to ${p}`);
          results.push({ platform: p, success: true });
        }
      } catch (err) {
        console.error(`Error sending to ${p}:`, err);
        results.push({ platform: p, success: false, error: String(err) });
      }
    }

    const allSuccessful = results.every(r => r.success);

    return new Response(
      JSON.stringify({ success: allSuccessful, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: allSuccessful ? 200 : 207,
      }
    );
  } catch (error: any) {
    console.error('Error in chat-notify function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
