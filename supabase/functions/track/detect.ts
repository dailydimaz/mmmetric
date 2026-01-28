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
        region: 'x-nf-subdivision-code', // erratic support
        city: 'x-nf-city',
        latitude: null, // Netlify doesn't provide coords
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
            
            // Extract latitude/longitude if available
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

    // Fallback check for just country if complete set not found
    // This maintains backward compatibility with existing extractGeoData logic
    const fallbackCountry = headers.get('x-country');
    if (fallbackCountry) {
        return { country: fallbackCountry, region: null, city: null, latitude: null, longitude: null };
    }

    return null;
}
