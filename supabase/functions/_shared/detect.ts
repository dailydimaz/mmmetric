export interface LocationData {
    country: string | null;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
}

const PROVIDER_HEADERS = [
    // Cloudflare
    {
        country: 'cf-ipcountry',
        region: 'cf-region-code',
        city: 'cf-ipcity',
        latitude: 'cf-iplat',
        longitude: 'cf-iplon',
    },
    // Vercel
    {
        country: 'x-vercel-ip-country',
        region: 'x-vercel-ip-country-region',
        city: 'x-vercel-ip-city',
        latitude: 'x-vercel-ip-latitude',
        longitude: 'x-vercel-ip-longitude',
    },
    // CloudFront
    {
        country: 'cloudfront-viewer-country',
        region: 'cloudfront-viewer-country-region',
        city: 'cloudfront-viewer-city',
        latitude: 'cloudfront-viewer-latitude',
        longitude: 'cloudfront-viewer-longitude',
    },
    // Netlify
    {
        country: 'x-nf-country-code',
        region: 'x-nf-subdivision-code',
        city: 'x-nf-city',
        latitude: null,
        longitude: null,
    },
    // Generic / Other CDNs
    {
        country: 'x-country-code',
        region: 'x-region-code',
        city: 'x-city',
        latitude: 'x-latitude',
        longitude: 'x-longitude',
    },
];

export function getLocationFromHeaders(headers: Headers): LocationData | null {
    for (const provider of PROVIDER_HEADERS) {
        const country = headers.get(provider.country);
        if (country) {
            const region = headers.get(provider.region);
            const city = headers.get(provider.city);
            
            let latitude: number | null = null;
            let longitude: number | null = null;
            
            if (provider.latitude) {
                const latStr = headers.get(provider.latitude);
                if (latStr) {
                    const parsed = parseFloat(latStr);
                    if (!isNaN(parsed)) latitude = parsed;
                }
            }
            
            if (provider.longitude) {
                const lonStr = headers.get(provider.longitude);
                if (lonStr) {
                    const parsed = parseFloat(lonStr);
                    if (!isNaN(parsed)) longitude = parsed;
                }
            }
            
            return {
                country,
                region: region ? (region.includes('-') ? region : `${country}-${region}`) : null,
                city: city ? decodeURIComponent(city) : null,
                latitude,
                longitude
            };
        }
    }

    // Fallback check for just country
    const fallbackCountry = headers.get('x-country');
    if (fallbackCountry) {
        return { country: fallbackCountry, region: null, city: null, latitude: null, longitude: null };
    }

    return null;
}

// ==================== LRU GeoIP Cache ====================

const GEO_CACHE_MAX_SIZE = 1024;
const GEO_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface GeoCacheEntry {
    data: LocationData | null;
    timestamp: number;
}

// Map preserves insertion order; we use it as an LRU cache
const geoCache = new Map<string, GeoCacheEntry>();

export function getCachedGeo(ip: string): LocationData | null | undefined {
    const entry = geoCache.get(ip);
    if (!entry) return undefined; // cache miss
    if (Date.now() - entry.timestamp > GEO_CACHE_TTL_MS) {
        geoCache.delete(ip);
        return undefined; // expired
    }
    // Move to end (most recently used)
    geoCache.delete(ip);
    geoCache.set(ip, entry);
    return entry.data;
}

export function setCachedGeo(ip: string, data: LocationData | null): void {
    // Evict oldest if at capacity
    if (geoCache.size >= GEO_CACHE_MAX_SIZE) {
        const oldestKey = geoCache.keys().next().value;
        if (oldestKey) geoCache.delete(oldestKey);
    }
    geoCache.set(ip, { data, timestamp: Date.now() });
}

// ==================== Private IP Detection ====================

export function isPrivateIp(ip: string): boolean {
    if (!ip || ip === 'unknown') return true;
    if (ip.startsWith('127.')) return true;       // loopback
    if (ip.startsWith('10.')) return true;         // 10.0.0.0/8
    if (ip.startsWith('192.168.')) return true;    // 192.168.0.0/16
    if (ip === '::1') return true;                 // IPv6 loopback
    if (ip.startsWith('fe80:')) return true;       // IPv6 link-local
    // 172.16.0.0/12 → 172.16.x.x through 172.31.x.x
    if (ip.startsWith('172.')) {
        const secondOctet = parseInt(ip.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
    return false;
}

// ==================== Free GeoIP API Fallback ====================

/**
 * Calls ip-api.com (free tier, 45 req/min) as a last-resort fallback
 * when both CDN headers and DB lookup miss.
 * Returns null on any failure — never throws.
 */
export async function lookupGeoApiFallback(ip: string): Promise<LocationData | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout
        
        const res = await fetch(
            `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,lat,lon`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!res.ok) return null;
        
        const data = await res.json();
        if (data.status !== 'success') return null;

        return {
            country: data.countryCode || null,
            region: data.regionName || null,
            city: data.city || null,
            latitude: typeof data.lat === 'number' ? data.lat : null,
            longitude: typeof data.lon === 'number' ? data.lon : null,
        };
    } catch {
        // Timeout, network error, etc. — silently fail
        return null;
    }
}
