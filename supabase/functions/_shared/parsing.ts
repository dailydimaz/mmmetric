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

// Bot detection patterns with names for reporting
const BOT_PATTERNS: { pattern: RegExp; name: string }[] = [
    { pattern: /googlebot/i, name: 'Googlebot' },
    { pattern: /bingbot/i, name: 'Bingbot' },
    { pattern: /yandex/i, name: 'Yandex' },
    { pattern: /baidu/i, name: 'Baidu' },
    { pattern: /duckduckbot/i, name: 'DuckDuckBot' },
    { pattern: /facebookexternalhit/i, name: 'Facebook' },
    { pattern: /twitterbot/i, name: 'Twitter' },
    { pattern: /linkedinbot/i, name: 'LinkedIn' },
    { pattern: /slackbot/i, name: 'Slack' },
    { pattern: /discordbot/i, name: 'Discord' },
    { pattern: /whatsapp/i, name: 'WhatsApp' },
    { pattern: /semrush/i, name: 'SEMrush' },
    { pattern: /ahrefs/i, name: 'Ahrefs' },
    { pattern: /mj12bot/i, name: 'Majestic' },
    { pattern: /headlesschrome/i, name: 'HeadlessChrome' },
    { pattern: /phantomjs/i, name: 'PhantomJS' },
    { pattern: /puppeteer/i, name: 'Puppeteer' },
    { pattern: /applebot/i, name: 'Applebot' },
    { pattern: /petalbot/i, name: 'PetalBot' },
    { pattern: /bytespider/i, name: 'ByteSpider' },
    { pattern: /gptbot/i, name: 'GPTBot' },
    { pattern: /claudebot/i, name: 'ClaudeBot' },
    { pattern: /bot/i, name: 'Unknown Bot' },
    { pattern: /crawler/i, name: 'Unknown Crawler' },
    { pattern: /spider/i, name: 'Unknown Spider' },
    { pattern: /scraper/i, name: 'Unknown Scraper' },
];

export function isBot(userAgent: string): boolean {
    if (!userAgent) return false;
    return BOT_PATTERNS.some(({ pattern }) => pattern.test(userAgent));
}

export function getBotName(userAgent: string): string {
    if (!userAgent) return 'Unknown Bot';
    for (const { pattern, name } of BOT_PATTERNS) {
        if (pattern.test(userAgent)) return name;
    }
    return 'Unknown Bot';
}
