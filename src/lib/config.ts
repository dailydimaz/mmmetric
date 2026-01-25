// Centralized configuration for self-hosted deployments
// All configurable URLs and app settings are derived from environment variables

/**
 * Get the application URL (frontend)
 * Falls back to window.location.origin for self-hosted instances
 */
export function getAppUrl(): string {
  return import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
}

/**
 * Get the tracking script URL
 */
export function getTrackingScriptUrl(): string {
  return `${getAppUrl()}/track.js`;
}

/**
 * Get the Supabase project URL
 */
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || '';
}

/**
 * Get the Supabase Edge Functions URL
 */
export function getSupabaseFunctionsUrl(): string {
  const url = getSupabaseUrl();
  return url ? `${url}/functions/v1` : '';
}

/**
 * Get the tracking API URL (Edge Function endpoint)
 */
export function getTrackingApiUrl(): string {
  return `${getSupabaseFunctionsUrl()}/track`;
}

/**
 * Get the redirect function URL for short links
 */
export function getRedirectUrl(slug: string): string {
  return `${getSupabaseFunctionsUrl()}/redirect?s=${slug}`;
}

/**
 * Get the pixel tracking URL
 */
export function getPixelUrl(trackingId: string): string {
  return `${getSupabaseFunctionsUrl()}/pixel?site_id=${trackingId}`;
}

/**
 * Get the application name (for branding)
 */
export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME || 'mmmetric';
}

/**
 * Check if this is a cloud-hosted instance (has Stripe configured)
 */
export function isCloudInstance(): boolean {
  return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
}

/**
 * Get the cloud instance URL (for migration prompts in self-hosted mode)
 * Returns empty string if not configured
 */
export function getCloudUrl(): string {
  return import.meta.env.VITE_CLOUD_URL || 'https://mmmetric.lovable.app';
}
