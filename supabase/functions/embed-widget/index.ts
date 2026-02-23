import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders, status: 204 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type") || "badge"; // badge, counter
    const theme = url.searchParams.get("theme") || "light"; // light, dark

    if (!token) {
        return new Response("Missing token", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Verify token and get site
        const { data: pubDash, error: pubError } = await supabase
            .from("public_dashboards")
            .select("site_id, is_enabled")
            .eq("share_token", token)
            .single();

        if (pubError || !pubDash || !pubDash.is_enabled) {
            return new Response("Not found or disabled", { status: 404 });
        }

        // 2. Fetch stats (Last 30 days)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString();

        const { data: stats, error: statsError } = await supabase
            .from("events")
            .select("visitor_id")
            .eq("site_id", pubDash.site_id)
            .eq("event_name", "pageview")
            .gte("created_at", startDateStr);

        if (statsError) throw statsError;

        const pageviews = stats?.length || 0;
        const uniqueVisitors = new Set(stats?.map(e => e.visitor_id).filter(Boolean)).size;

        // Formatting numbers
        const formatNum = (num: number) => {
            return num > 999999 ? (num / 1000000).toFixed(1) + 'M' :
                num > 999 ? (num / 1000).toFixed(1) + 'K' : num.toString();
        };

        const bgColor = theme === 'dark' ? '#1f2937' : '#ffffff';
        const textColor = theme === 'dark' ? '#f3f4f6' : '#111827';
        const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';

        let svgContent = '';

        if (type === 'counter') {
            svgContent = `
        <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" rx="8" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
          <text x="100" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="${textColor}" opacity="0.5" text-anchor="middle">LAST 30 DAYS</text>
          <text x="50" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="bold" fill="${textColor}" text-anchor="middle">${formatNum(uniqueVisitors)}</text>
          <text x="50" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="8" fill="${textColor}" opacity="0.6" text-anchor="middle">VISITORS</text>
          <text x="150" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="bold" fill="${textColor}" text-anchor="middle">${formatNum(pageviews)}</text>
          <text x="150" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="8" fill="${textColor}" opacity="0.6" text-anchor="middle">PAGEVIEWS</text>
          <line x1="100" y1="28" x2="100" y2="50" stroke="${borderColor}" stroke-width="1" />
        </svg>
      `;
        } else {
            // Default small badge
            const pStr = formatNum(pageviews);
            const rightWidth = Math.max(40, pStr.length * 8 + 10);
            const totalWidth = 60 + rightWidth;

            svgContent = `
        <svg width="${totalWidth}" height="20" xmlns="http://www.w3.org/2000/svg">
          <linearGradient id="b" x2="0" y2="100%">
            <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
            <stop offset="1" stop-opacity=".1"/>
          </linearGradient>
          <mask id="a">
            <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
          </mask>
          <g mask="url(#a)">
            <path fill="#555" d="M0 0h60v20H0z"/>
            <path fill="#4c1" d="M60 0h${rightWidth}v20H60z"/>
            <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
          </g>
          <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
            <text x="30" y="15" fill="#010101" fill-opacity=".3">views</text>
            <text x="30" y="14">views</text>
            <text x="${60 + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${pStr}</text>
            <text x="${60 + rightWidth / 2}" y="14">${pStr}</text>
          </g>
        </svg>
      `;
        }

        return new Response(svgContent.trim(), {
            headers: {
                ...corsHeaders,
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=3600"
            },
        });

    } catch (error: unknown) {
        console.error("Widget error:", error);
        return new Response("Internal Error", { status: 500 });
    }
});
