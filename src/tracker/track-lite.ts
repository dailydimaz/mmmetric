// @ts-nocheck
/**
 * mmmetric Analytics - LITE Tracking Script
 * Minimal footprint: Pageviews, sessions, UTM, referrer, SPA support only
 * Target: < 1.5 KB gzipped
 */
(function () {
    'use strict';

    // Configuration
    const script = document.currentScript || document.querySelector('script[data-site]');
    const siteId = script?.getAttribute('data-site');

    // API URL derivation
    let apiUrl = script?.getAttribute('data-api');
    if (!apiUrl && script?.src) {
        try {
            const scriptUrl = new URL(script.src);
            if (scriptUrl.hostname.includes('supabase.co') || scriptUrl.hostname.includes('supabase.in')) {
                apiUrl = scriptUrl.origin + '/functions/v1/track';
            } else {
                const supabaseUrl = script.getAttribute('data-supabase-url');
                if (supabaseUrl) apiUrl = supabaseUrl + '/functions/v1/track';
            }
        } catch (e) { }
    }

    if (!siteId || !apiUrl) return;

    // Session
    let sessionId = null;
    let lastActivity = Date.now();
    const SESSION_TIMEOUT = 30 * 60 * 1000;

    const getSessionId = () => {
        const now = Date.now();
        if (!sessionId || (now - lastActivity) > SESSION_TIMEOUT) {
            sessionId = Math.random().toString(36).slice(2) + now.toString(36);
        }
        lastActivity = now;
        return sessionId;
    };

    // Utils
    const getUtmParams = () => {
        const params = new URLSearchParams(window.location.search);
        const utm = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
            const val = params.get(key);
            if (val) utm[key] = val;
        });
        return Object.keys(utm).length ? utm : null;
    };

    const getReferrer = () => {
        const ref = document.referrer;
        if (!ref) return null;
        try {
            if (new URL(ref).hostname === window.location.hostname) return null;
            return ref;
        } catch { return null; }
    };

    const track = (eventName, properties) => {
        const utm = getUtmParams();
        const merged = { ...properties };
        if (utm) merged.utm = utm;
        if (window.screen) merged.screen = `${window.screen.width}x${window.screen.height}`;

        const payload = {
            site_id: siteId,
            event_name: eventName || 'pageview',
            url: window.location.pathname,
            referrer: getReferrer(),
            session_id: getSessionId(),
            language: navigator.language || navigator.userLanguage,
            properties: Object.keys(merged).length ? merged : {}
        };

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
            if (!navigator.sendBeacon(apiUrl, blob)) {
                fetch(apiUrl, { method: 'POST', body: JSON.stringify(payload), keepalive: true }).catch(() => { });
            }
        } else {
            fetch(apiUrl, { method: 'POST', body: JSON.stringify(payload), keepalive: true }).catch(() => { });
        }
    };

    // SPA Support
    let lastPath = window.location.pathname;

    const handleNav = () => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            track('pageview');
        }
    };

    if (window.history.pushState) {
        const oPush = window.history.pushState;
        window.history.pushState = function () { oPush.apply(this, arguments); handleNav(); };
        window.addEventListener('popstate', handleNav);
    }

    // Expose global for custom events
    (window as any).mmmetric = (eventName: string, props?: Record<string, unknown>) => {
        track(eventName, props || {});
    };

    const init = () => {
        track('pageview');
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);

})();
