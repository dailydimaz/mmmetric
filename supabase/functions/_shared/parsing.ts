// Shared parsing utilities for track and pixel edge functions

// Parse user agent to extract browser
export function parseBrowser(ua: string): string {
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
    return 'Unknown';
}

// Parse user agent to extract OS
export function parseOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'macOS';
    if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
}

// Parse user agent to extract device type
export function parseDevice(ua: string): string {
    if (ua.includes('Tablet') || ua.includes('iPad')) return 'tablet';
    if (ua.includes('Mobile') || ua.includes('Android')) return 'mobile';
    return 'desktop';
}

// Full parse returning all three
export function parseUserAgent(ua: string): { browser: string; os: string; device_type: string } {
    return {
        browser: parseBrowser(ua),
        os: parseOS(ua),
        device_type: parseDevice(ua),
    };
}

// Generate a cryptographic hash for visitor fingerprinting using SHA-256
// Rotates daily for privacy compliance (24h retention)
export async function generateVisitorId(ip: string, ua: string): Promise<string> {
    const dateSalt = new Date().toISOString().slice(0, 10);
    const secretSalt = Deno.env.get('DAILY_SALT_SECRET');
    if (!secretSalt) {
        throw new Error('Server configuration error: missing required secret');
    }

    const str = `${ip}-${ua}-${dateSalt}-${secretSalt}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Bot detection patterns
const BOT_PATTERNS = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /googlebot/i, /bingbot/i, /yandex/i, /baidu/i,
    /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
    /slackbot/i, /discordbot/i, /whatsapp/i,
    /semrush/i, /ahrefs/i, /mj12bot/i,
    /headlesschrome/i, /phantomjs/i, /puppeteer/i
];

export function isBot(userAgent: string): boolean {
    if (!userAgent) return false;
    return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}
