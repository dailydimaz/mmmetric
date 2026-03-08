// @ts-nocheck
/**
 * mmmetric Analytics - LITE Tracking Script
 * Ultra-minimal: Pageviews, sessions, referrer, SPA support, custom events
 * Config: data-auto-track, data-domains, data-do-not-track, data-exclude-search,
 *         data-exclude-hash, data-tag
 * Target: < 1.5 KB gzipped
 */
(function () {
    'use strict';

    const s = document.currentScript || document.querySelector('script[data-site]');
    const id = s?.getAttribute('data-site');

    // Config flags
    const autoTrack = s?.getAttribute('data-auto-track') !== 'false';
    const allowedDomains = (s?.getAttribute('data-domains') || '').split(',').map(d => d.trim()).filter(Boolean);
    const respectDnt = s?.getAttribute('data-do-not-track') === 'true';
    const excludeSearch = s?.getAttribute('data-exclude-search') === 'true';
    const excludeHash = s?.getAttribute('data-exclude-hash') === 'true';
    const globalTag = s?.getAttribute('data-tag') || null;

    let api = s?.getAttribute('data-api');
    if (!api && s?.src) {
        try {
            const u = new URL(s.src);
            if (u.hostname.includes('supabase.co') || u.hostname.includes('supabase.in')) {
                api = u.origin + '/functions/v1/track';
            } else {
                const b = s.getAttribute('data-supabase-url');
                if (b) api = b + '/functions/v1/track';
            }
        } catch (e) { }
    }

    if (!id || !api) return;

    // DNT check
    if (respectDnt && navigator.doNotTrack === '1') return;

    // Domain allowlist check
    if (allowedDomains.length && !allowedDomains.some(d => location.hostname === d || location.hostname.endsWith('.' + d))) return;

    let sid = null;
    let la = Date.now();

    const gs = () => {
        const n = Date.now();
        if (!sid || n - la > 18e5) sid = Math.random().toString(36).slice(2) + n.toString(36);
        la = n;
        return sid;
    };

    const gr = () => {
        const r = document.referrer;
        if (!r) return null;
        try { return new URL(r).hostname === location.hostname ? null : r; } catch { return null; }
    };

    const getUrl = () => {
        let u = location.pathname;
        if (!excludeSearch && location.search) u += location.search;
        if (!excludeHash && location.hash) u += location.hash;
        return u;
    };

    const t = (e, p) => {
        const d = {
            site_id: id,
            event_name: e || 'pageview',
            url: getUrl(),
            title: document.title || null,
            hostname: location.hostname,
            referrer: gr(),
            session_id: gs(),
            properties: p && Object.keys(p).length ? p : {}
        };
        if (globalTag) d.tag = globalTag;
        const b = JSON.stringify(d);
        if (navigator.sendBeacon) {
            if (!navigator.sendBeacon(api, new Blob([b], { type: 'text/plain' }))) {
                fetch(api, { method: 'POST', body: b, keepalive: true }).catch(() => { });
            }
        } else {
            fetch(api, { method: 'POST', body: b, keepalive: true }).catch(() => { });
        }
    };

    let lp = location.pathname;
    const h = () => { if (location.pathname !== lp) { lp = location.pathname; if (autoTrack) t('pageview'); } };

    if (history.pushState) {
        const op = history.pushState;
        history.pushState = function () { op.apply(this, arguments); h(); };
        addEventListener('popstate', h);
    }

    // Expose global API
    (window as any).mmmetric = (e: string, p?: Record<string, unknown>) => { t(e, p || {}); };

    // identify() support
    (window as any).mmmetric.identify = (idOrData?: string | Record<string, unknown>, data?: Record<string, unknown>) => {
        const payload: Record<string, unknown> = {};
        if (typeof idOrData === 'string') {
            payload.custom_id = idOrData;
            if (data && typeof data === 'object') payload.data = data;
        } else if (typeof idOrData === 'object') {
            payload.data = idOrData;
        }
        t('identify', payload);
    };

    if (autoTrack) {
        if (document.readyState === 'complete') t('pageview');
        else addEventListener('load', () => t('pageview'));
    }
})();
