// @ts-nocheck
/**
 * mmmetric Analytics - Lightweight Tracking Script
 */
(function () {
    'use strict';

    // Configuration
    const script = document.currentScript || document.querySelector('script[data-site]');
    const siteId = script?.getAttribute('data-site');
    const crossDomains = (script?.getAttribute('data-cross-domain') || '').split(',').map(d => d.trim()).filter(Boolean);

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
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get('_mm_sid');

        if (urlSessionId && !sessionId) {
            sessionId = urlSessionId;
            lastActivity = now;
        }

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

    // Features
    const setupOutbound = () => {
        document.addEventListener('click', e => {
            const target = e.target.closest('a');
            if (!target?.href) return;

            try {
                const url = new URL(target.href, window.location.origin);
                if (url.hostname !== window.location.hostname) {
                    track('outbound', { href: target.href, text: target.innerText.substring(0, 100) });
                    if (crossDomains.some(d => url.hostname.includes(d))) {
                        target.href += (target.href.includes('?') ? '&' : '?') + '_mm_sid=' + getSessionId();
                    }
                }
            } catch { }
        }, true);
    };

    const setupDownloads = () => {
        const exts = ['.pdf', '.docx', '.xlsx', '.zip', '.rar', '.csv', '.mp3', '.mp4', '.dmg', '.exe', '.pptx', '.jpg', '.png', '.gif', '.svg'];
        document.addEventListener('click', e => {
            const target = e.target.closest('a');
            if (!target?.href) return;
            const lower = target.href.toLowerCase().split('?')[0];
            const ext = exts.find(ex => lower.endsWith(ex));
            if (ext) {
                track('file_download', {
                    href: target.href,
                    filename: target.href.split('/').pop().split('?')[0],
                    extension: ext.substring(1)
                });
            }
        }, true);
    };

    const setupScroll = () => {
        const milestones = [25, 50, 75, 90, 100];
        const sent = {};
        let timeout;

        const check = () => {
            const h = document.documentElement;
            const b = document.body;
            const sh = Math.max(b.scrollHeight, h.scrollHeight, b.offsetHeight, h.offsetHeight, b.clientHeight, h.clientHeight);
            const st = window.pageYOffset || h.scrollTop;
            const ch = window.innerHeight || h.clientHeight;

            if (sh <= ch) {
                if (!sent[100]) { sent[100] = true; track('scroll_depth', { percent: 100, url: window.location.pathname }); }
                return;
            }

            const pct = Math.min(100, Math.round(((st + ch) / sh) * 100));
            milestones.forEach(m => {
                if (pct >= m && !sent[m]) {
                    sent[m] = true;
                    track('scroll_depth', { percent: m, url: window.location.pathname });
                }
            });
        };

        window.addEventListener('scroll', () => {
            clearTimeout(timeout);
            timeout = setTimeout(check, 200);
        });
        setTimeout(check, 1000);
    };

    // SPA & Engagement
    let lastPath = window.location.pathname;
    let startTime = Date.now();
    let engaged = false;

    const sendEngagement = () => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        if (duration >= 5 && duration < 86400) {
            track('engagement', { duration_seconds: duration, url: lastPath });
            engaged = true;
        }
    };

    const handleNav = () => {
        if (window.location.pathname !== lastPath) {
            sendEngagement();
            lastPath = window.location.pathname;
            startTime = Date.now();
            engaged = false;
            track('pageview');
        }
    };

    if (window.history.pushState) {
        const oPush = window.history.pushState;
        window.history.pushState = function () { oPush.apply(this, arguments); handleNav(); };
        window.addEventListener('popstate', handleNav);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) sendEngagement();
        else { startTime = Date.now(); engaged = false; }
    });
    window.addEventListener('pagehide', sendEngagement);
    setInterval(() => {
        if (!document.hidden && !engaged && (Date.now() - startTime) > 30000) {
            sendEngagement();
            startTime = Date.now();
            engaged = false;
        }
    }, 30000);

    // Forms
    const setupForms = () => {
        const active = new Set();
        document.addEventListener('focusin', e => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                const form = e.target.form;
                if (form && !active.has(form)) {
                    active.add(form);
                    track('form_start', { form_id: form.id || form.name || 'unknown' });
                }
            }
        }, true);

        document.addEventListener('submit', e => {
            const form = e.target;
            if (form?.tagName === 'FORM') {
                active.delete(form);
                track('form_submit', { form_id: form.id || form.name || 'unknown' });
            }
        }, true);
    };

    // Vitals
    const setupVitals = () => {
        if (typeof PerformanceObserver === 'function') {
            const send = (m, v) => track('web_vitals', { metric: m, value: m === 'CLS' ? v : Math.round(v), rating: v > (m === 'LCP' ? 2500 : m === 'CLS' ? 0.1 : 200) ? 'poor' : 'good' }); // Simplified rating logic for space

            try {
                new PerformanceObserver(l => {
                    const e = l.getEntries().pop();
                    if (e) window._mm_lcp = e.startTime;
                }).observe({ type: 'largest-contentful-paint', buffered: true });

                window._mm_cls = 0;
                new PerformanceObserver(l => {
                    l.getEntries().forEach(e => { if (!e.hadRecentInput) window._mm_cls += e.value; });
                }).observe({ type: 'layout-shift', buffered: true });

                window._mm_inp = 0;
                new PerformanceObserver(l => {
                    l.getEntries().forEach(e => { if (e.interactionId && e.duration > window._mm_inp) window._mm_inp = e.duration; });
                }).observe({ type: 'event', durationThreshold: 16, buffered: true });

                const report = () => {
                    if (window._mm_lcp !== undefined) send('LCP', window._mm_lcp);
                    if (window._mm_cls !== undefined) send('CLS', window._mm_cls);
                    if (window._mm_inp !== undefined && window._mm_inp > 0) send('INP', window._mm_inp);
                };
                window.addEventListener('visibilitychange', () => { if (document.hidden) report(); });
                window.addEventListener('pagehide', report);
            } catch (e) { }
        }
    };

    // Error Tracking - Privacy-first approach
    const setupErrorTracking = () => {
        // Global error handler for uncaught errors
        window.addEventListener('error', (event) => {
            // Skip cross-origin script errors (no useful info)
            if (event.message === 'Script error.' && !event.filename) return;
            
            track('js_error', {
                message: sanitizeErrorMessage(event.message || 'Unknown error'),
                filename: sanitizeFilename(event.filename),
                lineno: event.lineno,
                colno: event.colno,
                type: 'uncaught',
                url: window.location.pathname
            });
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason;
            let message = 'Unhandled Promise Rejection';
            
            if (reason instanceof Error) {
                message = reason.message;
            } else if (typeof reason === 'string') {
                message = reason;
            }

            track('js_error', {
                message: sanitizeErrorMessage(message),
                type: 'unhandled_rejection',
                url: window.location.pathname
            });
        });
    };

    // Privacy: Remove potential PII from error messages
    const sanitizeErrorMessage = (msg: string): string => {
        if (!msg) return 'Unknown error';
        // Truncate long messages
        let sanitized = msg.substring(0, 500);
        // Remove emails
        sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
        // Remove potential API keys/tokens (long alphanumeric strings)
        sanitized = sanitized.replace(/[a-zA-Z0-9_-]{32,}/g, '[token]');
        // Remove URLs with query params that might contain sensitive data
        sanitized = sanitized.replace(/https?:\/\/[^\s]+\?[^\s]*/g, (url) => {
            try {
                const u = new URL(url);
                return u.origin + u.pathname + '?[params]';
            } catch { return '[url]'; }
        });
        return sanitized;
    };

    // Privacy: Only keep filename, not full path
    const sanitizeFilename = (filename: string | undefined): string => {
        if (!filename) return 'unknown';
        try {
            const url = new URL(filename);
            return url.pathname.split('/').pop() || url.pathname;
        } catch {
            return filename.split('/').pop() || filename;
        }
    };

    // Social Share Tracking - Detect shares to social platforms
    const setupSocialShare = () => {
        // Known social share URL patterns
        const sharePatterns: Record<string, RegExp> = {
            twitter: /twitter\.com\/(intent\/tweet|share)|x\.com\/(intent\/tweet|share)/i,
            facebook: /facebook\.com\/(sharer|share\.php|dialog\/share)/i,
            linkedin: /linkedin\.com\/(shareArticle|sharing\/share-offsite)/i,
            pinterest: /pinterest\.com\/pin\/create/i,
            reddit: /reddit\.com\/submit/i,
            whatsapp: /wa\.me|api\.whatsapp\.com|whatsapp:\/\//i,
            telegram: /t\.me\/share|telegram\.me\/share/i,
            email: /^mailto:/i,
        };

        // Track share link clicks
        document.addEventListener('click', (e) => {
            const target = (e.target as HTMLElement).closest('a');
            if (!target?.href) return;

            try {
                const href = target.href;
                
                for (const [platform, pattern] of Object.entries(sharePatterns)) {
                    if (pattern.test(href)) {
                        track('social_share', {
                            platform,
                            method: 'click',
                            shared_url: extractSharedUrl(href, platform),
                            url: window.location.pathname
                        });
                        break;
                    }
                }
            } catch { }
        }, true);

        // Track native Web Share API usage
        if (navigator.share) {
            const originalShare = navigator.share.bind(navigator);
            navigator.share = async function(data) {
                track('social_share', {
                    platform: 'native',
                    method: 'web_share_api',
                    shared_url: data?.url || window.location.href,
                    shared_title: data?.title?.substring(0, 100),
                    url: window.location.pathname
                });
                return originalShare(data);
            };
        }

        // Track copy-to-clipboard for share purposes (common pattern)
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest('button, [role="button"]');
            if (!button) return;

            // Check for common "copy link" / "share" button patterns
            const text = (button.textContent || '').toLowerCase();
            const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
            const classList = button.className.toLowerCase();

            const copyIndicators = ['copy link', 'copy url', 'copy to clipboard', 'share link'];
            const isCopyButton = copyIndicators.some(indicator => 
                text.includes(indicator) || ariaLabel.includes(indicator) || classList.includes('copy')
            );

            if (isCopyButton) {
                track('social_share', {
                    platform: 'copy',
                    method: 'clipboard',
                    url: window.location.pathname
                });
            }
        }, true);
    };

    // Helper to extract the shared URL from share links
    const extractSharedUrl = (href: string, platform: string): string => {
        try {
            const url = new URL(href);
            const params = url.searchParams;
            
            switch (platform) {
                case 'twitter':
                    return params.get('url') || params.get('text') || window.location.href;
                case 'facebook':
                    return params.get('u') || params.get('href') || window.location.href;
                case 'linkedin':
                    return params.get('url') || window.location.href;
                case 'pinterest':
                    return params.get('url') || window.location.href;
                case 'reddit':
                    return params.get('url') || window.location.href;
                default:
                    return window.location.href;
            }
        } catch {
            return window.location.href;
        }
    };

    // Config injection (simplified)
    const fetchConfig = () => {
        fetch(apiUrl.replace('/track', '/get-config'), {
            method: 'POST',
            body: JSON.stringify({ site_id: siteId }),
            headers: { 'Content-Type': 'application/json' }
        }).then(r => r.json()).then(d => {
            if (d.tags) d.tags.forEach(t => {
                try {
                    if (t.type === 'custom_script' && t.config.url) {
                        const s = document.createElement('script'); s.src = t.config.url; s.async = true; document.head.appendChild(s);
                    }
                    // ... other tags omitted for size, add back if critical
                } catch (e) { }
            });
        }).catch(() => { });
    };

    // Site Search Tracking
    const setupSiteSearch = () => {
        // Auto-detect common search inputs
        const searchSelectors = [
            'input[type="search"]',
            'input[name="q"]',
            'input[name="query"]',
            'input[name="search"]',
            'input[name="s"]',
            '[role="searchbox"]',
            '.search-input',
            '#search',
            '#searchInput'
        ];

        let lastSearchQuery = '';
        let searchDebounce: ReturnType<typeof setTimeout>;

        const trackSearch = (query: string, resultCount?: number) => {
            if (!query || query.length < 2) return;
            if (query === lastSearchQuery) return;
            lastSearchQuery = query;

            track('site_search', {
                query: query.substring(0, 200), // Limit query length
                result_count: resultCount ?? -1, // -1 means unknown
                url: window.location.pathname
            });
        };

        // Listen to form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target as HTMLFormElement;
            const searchInput = form.querySelector(searchSelectors.join(',')) as HTMLInputElement;
            if (searchInput?.value) {
                trackSearch(searchInput.value.trim());
            }
        }, true);

        // Listen to Enter key on search inputs
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const target = e.target as HTMLElement;
            if (target.matches(searchSelectors.join(','))) {
                const input = target as HTMLInputElement;
                if (input.value) {
                    trackSearch(input.value.trim());
                }
            }
        }, true);

        // Expose global function for manual tracking with result count
        (window as any).mmmetric = (eventName: string, props?: Record<string, unknown>) => {
            if (eventName === 'site_search' && props?.query) {
                trackSearch(
                    String(props.query),
                    typeof props.result_count === 'number' ? props.result_count : undefined
                );
            } else {
                track(eventName, props || {});
            }
        };
    };

    // Reading Depth - Track actual reading engagement vs scroll-through
    const setupReadingDepth = () => {
        const zones = [0, 25, 50, 75, 100]; // Percentage zones
        const zoneTime: Record<number, number> = {}; // Time spent in each zone (ms)
        let currentZone = 0;
        let zoneStartTime = Date.now();
        let isReading = true; // Track if user is actively on page
        let lastScrollTime = Date.now();
        let readingReported = false;

        // Initialize zone times
        zones.forEach(z => zoneTime[z] = 0);

        const getScrollZone = (): number => {
            const h = document.documentElement;
            const b = document.body;
            const sh = Math.max(b.scrollHeight, h.scrollHeight, b.offsetHeight, h.offsetHeight, b.clientHeight, h.clientHeight);
            const st = window.pageYOffset || h.scrollTop;
            const ch = window.innerHeight || h.clientHeight;

            if (sh <= ch) return 100; // Short page, all visible

            const pct = Math.min(100, Math.round(((st + ch / 2) / sh) * 100)); // Center of viewport
            
            // Map to nearest zone
            if (pct < 12.5) return 0;
            if (pct < 37.5) return 25;
            if (pct < 62.5) return 50;
            if (pct < 87.5) return 75;
            return 100;
        };

        const updateZoneTime = () => {
            if (!isReading) return;
            const now = Date.now();
            const elapsed = now - zoneStartTime;
            zoneTime[currentZone] = (zoneTime[currentZone] || 0) + elapsed;
            zoneStartTime = now;
        };

        const checkZone = () => {
            const newZone = getScrollZone();
            if (newZone !== currentZone) {
                updateZoneTime();
                currentZone = newZone;
                zoneStartTime = Date.now();
            }
            lastScrollTime = Date.now();
        };

        // Calculate reading score (0-100)
        const calculateReadingScore = (): number => {
            const totalTime = Object.values(zoneTime).reduce((a, b) => a + b, 0);
            if (totalTime < 5000) return 0; // Less than 5 seconds, not enough data

            // A "reader" spends time distributed across zones they scrolled to
            // A "skimmer" scrolls quickly through with little time per zone
            const zonesVisited = Object.entries(zoneTime).filter(([_, t]) => t > 2000).length;
            const avgTimePerZone = totalTime / Math.max(1, zonesVisited);
            
            // Score based on:
            // 1. Time spent (more time = higher engagement)
            // 2. Distribution across zones (even distribution = thorough reading)
            
            // Time factor: 30+ seconds is good reading
            const timeFactor = Math.min(1, totalTime / 30000);
            
            // Distribution factor: reading multiple zones thoroughly
            const distFactor = zonesVisited / zones.length;
            
            // Combine factors (weighted average)
            const score = Math.round((timeFactor * 0.6 + distFactor * 0.4) * 100);
            return Math.min(100, score);
        };

        const sendReadingDepth = () => {
            if (readingReported) return;
            updateZoneTime();
            
            const totalTime = Object.values(zoneTime).reduce((a, b) => a + b, 0);
            if (totalTime < 3000) return; // Minimum 3 seconds on page

            const score = calculateReadingScore();
            const maxScrollZone = Math.max(...Object.entries(zoneTime)
                .filter(([_, t]) => t > 0)
                .map(([z]) => parseInt(z)));

            track('reading_depth', {
                score,
                classification: score >= 60 ? 'reader' : score >= 30 ? 'skimmer' : 'bouncer',
                total_time_ms: totalTime,
                max_depth: maxScrollZone,
                zone_times: {
                    top: Math.round(zoneTime[0] / 1000),
                    quarter: Math.round(zoneTime[25] / 1000),
                    half: Math.round(zoneTime[50] / 1000),
                    three_quarter: Math.round(zoneTime[75] / 1000),
                    bottom: Math.round(zoneTime[100] / 1000)
                },
                url: window.location.pathname
            });
            readingReported = true;
        };

        // Track scroll position changes
        let scrollTimeout: ReturnType<typeof setTimeout>;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(checkZone, 100);
        });

        // Pause tracking when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                updateZoneTime();
                isReading = false;
                sendReadingDepth();
            } else {
                isReading = true;
                zoneStartTime = Date.now();
            }
        });

        // Send on page unload
        window.addEventListener('pagehide', sendReadingDepth);

        // Periodic update while reading
        setInterval(() => {
            if (!document.hidden && isReading) {
                updateZoneTime();
                zoneStartTime = Date.now();
            }
        }, 5000);
    };

    const init = () => {
        track('pageview');
        setupOutbound();
        setupDownloads();
        setupScroll();
        setupForms();
        setupVitals();
        setupErrorTracking();
        setupSiteSearch();
        setupReadingDepth();
        setupSocialShare();
        fetchConfig();
        setTimeout(() => {
            if (document.title.toLowerCase().includes('404')) track('404', { url: window.location.href, referrer: document.referrer });
        }, 1000);
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);

})();
