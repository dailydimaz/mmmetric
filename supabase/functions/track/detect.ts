export interface LocationData {
    country: string | null;
    region: string | null;
    city: string | null;
}

const PROVIDER_HEADERS = [
    // Cloudflare
    {
        country: 'cf-ipcountry',
        region: 'cf-region-code',
        city: 'cf-ipcity',
    },
    // Vercel
    {
        country: 'x-vercel-ip-country',
        region: 'x-vercel-ip-country-region',
        city: 'x-vercel-ip-city',
    },
    // CloudFront
    {
        country: 'cloudfront-viewer-country',
        region: 'cloudfront-viewer-country-region',
        city: 'cloudfront-viewer-city',
    },
    // Netlify
    {
        country: 'x-nf-country-code',
        region: 'x-nf-subdivision-code', // erratic support
        city: 'x-nf-city',
    },
    // Generic / Other CDNs
    {
        country: 'x-country-code',
        region: 'x-region-code',
        city: 'x-city',
    },
];

export function getLocationFromHeaders(headers: Headers): LocationData | null {
    for (const provider of PROVIDER_HEADERS) {
        const country = headers.get(provider.country);
        if (country) {
            const region = headers.get(provider.region);
            const city = headers.get(provider.city);
            return {
                country,
                region: region ? (region.includes('-') ? region : `${country}-${region}`) : null,
                city: city ? decodeURIComponent(city) : null
            };
        }
    }

    // Fallback check for just country if complete set not found
    // This maintains backward compatibility with existing extractGeoData logic
    const fallbackCountry = headers.get('x-country');
    if (fallbackCountry) {
        return { country: fallbackCountry, region: null, city: null };
    }

    return null;
}
