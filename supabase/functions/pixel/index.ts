import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getLocationFromHeaders, getCachedGeo, setCachedGeo, isPrivateIp, lookupGeoApiFallback } from "../_shared/detect.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 1x1 Transparent GIF
const GIF_BUFFER = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]);

const GIF_HEADERS = {
    "Content-Type": "image/gif",
    "Cache-Control": "no-cache, no-store, must-revalidate"
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const params = url.searchParams;

        const trackingId = params.get('tracking_id') || params.get('site_id');
        const pageUrl = params.get('url') || '/';
        const referrer = params.get('ref') || null;
        const event_name = params.get('event') || 'pageview';

        if (!trackingId) {
            return new Response(GIF_BUFFER, { headers: { ...corsHeaders, ...GIF_HEADERS } });
        }

        const userAgent = req.headers.get('user-agent') || '';
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

        // === Geo Resolution: Headers → Cache → DB → Free API ===
        const location = getLocationFromHeaders(req.headers);
        let geoCountry = location?.country?.toUpperCase() || null;
        let geoCity = location?.city || null;
        let geoLatitude = location?.latitude || null;
        let geoLongitude = location?.longitude || null;

        const visitor_id = await generateVisitorId(ip, userAgent);
        const session_id = `${visitor_id}-${Date.now()}`;

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fallback chain when CDN headers are absent
        if (!geoCountry && !isPrivateIp(ip)) {
            // 1. Check in-memory LRU cache
            const cached = getCachedGeo(ip);
            if (cached !== undefined) {
                if (cached) {
                    geoCountry = cached.country?.toUpperCase() || null;
                    geoCity = cached.city || null;
                    geoLatitude = cached.latitude;
                    geoLongitude = cached.longitude;
                }
            } else {
                let resolved = false;

                // 2. Database lookup
                try {
                    const { data: geoData } = await supabase.rpc('lookup_geoip', { ip_address: ip });
                    if (geoData && geoData.length > 0) {
                        geoCountry = geoData[0].country?.toUpperCase() || null;
                        geoCity = geoData[0].city || null;
                        if (geoData[0].latitude != null && geoData[0].longitude != null) {
                            geoLatitude = Number(geoData[0].latitude);
                            geoLongitude = Number(geoData[0].longitude);
                        }
                        resolved = true;
                    }
                } catch (e) {
                    console.warn('Pixel GeoIP DB lookup failed:', e);
                }

                // 3. Free API fallback (ip-api.com)
                if (!resolved) {
                    try {
                        const apiResult = await lookupGeoApiFallback(ip);
                        if (apiResult && apiResult.country) {
                            geoCountry = apiResult.country.toUpperCase();
                            geoCity = apiResult.city || null;
                            geoLatitude = apiResult.latitude;
                            geoLongitude = apiResult.longitude;
                            resolved = true;
                        }
                    } catch {
                        // Silent fail
                    }
                }

                // Cache the result (even null)
                setCachedGeo(ip, resolved ? {
                    country: geoCountry,
                    region: null,
                    city: geoCity,
                    latitude: geoLatitude,
                    longitude: geoLongitude,
                } : null);
            }
        }

        // Verify site exists
        const { data: site } = await supabase
            .from('sites')
            .select('id')
            .eq('tracking_id', trackingId)
            .maybeSingle();

    if (site) {
            const eventInsert = {
                site_id: site.id,
                event_name,
                url: pageUrl,
                referrer,
                visitor_id,
                session_id,
                browser: parseBrowser(userAgent),
                os: parseOS(userAgent),
                device_type: parseDevice(userAgent),
                country: geoCountry,
                city: geoCity,
                properties: { type: 'pixel' }
            };

            // Single-write to partitioned table only (legacy dual-write removed)
            // deno-lint-ignore no-explicit-any
            const promises: Promise<any>[] = [
                Promise.resolve(supabase.from('events_partitioned').insert(eventInsert))
            ];

            // Upsert city coordinates if we have lat/lng
            if (geoCity && geoCountry && geoLatitude != null && geoLongitude != null) {
                promises.push(
                    Promise.resolve(supabase.from('city_coordinates').upsert({
                        country_code: geoCountry,
                        city_name: geoCity,
                        latitude: geoLatitude,
                        longitude: geoLongitude,
                    }, { onConflict: 'country_code,city_name', ignoreDuplicates: false }))
                );
            }

            await Promise.allSettled(promises);
        }

        return new Response(GIF_BUFFER, { headers: { ...corsHeaders, ...GIF_HEADERS } });

    } catch (error) {
        console.error('Pixel error:', error);
        return new Response(GIF_BUFFER, { headers: { ...corsHeaders, ...GIF_HEADERS } });
    }
});

// Helper functions
async function generateVisitorId(ip: string, ua: string): Promise<string> {
    const dailySalt = Deno.env.get('DAILY_SALT_SECRET');
    if (!dailySalt) {
      throw new Error('DAILY_SALT_SECRET is not configured');
    }
    const today = new Date().toISOString().slice(0, 10);
    const str = `${ip}-${ua}-${dailySalt}-${today}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseBrowser(ua: string): string {
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
    return 'Unknown';
}

function parseOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'macOS';
    if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
}

function parseDevice(ua: string): string {
    if (ua.includes('Tablet') || ua.includes('iPad')) return 'tablet';
    if (ua.includes('Mobile') || ua.includes('Android')) return 'mobile';
    return 'desktop';
}
