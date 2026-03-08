// @ts-nocheck
/**
 * mmmetric Analytics - LITE Tracking Script
 * Ultra-minimal: Pageviews, sessions, referrer, SPA support, custom events
 * Target: < 1 KB gzipped
 */
(function () {
    'use strict';

    const s = document.currentScript || document.querySelector('script[data-site]');
    const id = s?.getAttribute('data-site');

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

    const t = (e, p) => {
        const d = {
            site_id: id,
            event_name: e || 'pageview',
            url: location.pathname,
            referrer: gr(),
            session_id: gs(),
            properties: p && Object.keys(p).length ? p : {}
        };
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
    const h = () => { if (location.pathname !== lp) { lp = location.pathname; t('pageview'); } };

    if (history.pushState) {
        const op = history.pushState;
        history.pushState = function () { op.apply(this, arguments); h(); };
        addEventListener('popstate', h);
    }

    (window as any).mmmetric = (e: string, p?: Record<string, unknown>) => { t(e, p || {}); };

    if (document.readyState === 'complete') t('pageview');
    else addEventListener('load', () => t('pageview'));
})();
