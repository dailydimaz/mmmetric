// @ts-nocheck — tracker scripts run outside React/TS context
/**
 * mmmetric Analytics - FULL Tracking Script
 * Config: data-auto-track, data-domains, data-do-not-track, data-exclude-search,
 *         data-exclude-hash, data-before-send, data-tag
 */
(function () {
    'use strict';

    // Configuration
    const script = document.currentScript || document.querySelector('script[data-site]');
    const siteId = script?.getAttribute('data-site');
    const crossDomains = (script?.getAttribute('data-cross-domain') || '').split(',').map(d => d.trim()).filter(Boolean);

    // Config flags
    const autoTrack = script?.getAttribute('data-auto-track') !== 'false';
    const allowedDomains = (script?.getAttribute('data-domains') || '').split(',').map(d => d.trim()).filter(Boolean);
    const respectDnt = script?.getAttribute('data-do-not-track') === 'true';
    const excludeSearch = script?.getAttribute('data-exclude-search') === 'true';
    const excludeHash = script?.getAttribute('data-exclude-hash') === 'true';
    const beforeSendFn = script?.getAttribute('data-before-send');
    const globalTag = script?.getAttribute('data-tag') || null;

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

    // DNT check
    if (respectDnt && navigator.doNotTrack === '1') return;

    // Domain allowlist check
    if (allowedDomains.length && !allowedDomains.some(d => location.hostname === d || location.hostname.endsWith('.' + d))) return;

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

    const getUrl = () => {
        let u = window.location.pathname;
        if (!excludeSearch && window.location.search) u += window.location.search;
        if (!excludeHash && window.location.hash) u += window.location.hash;
        return u;
    };

    const track = (eventName, properties) => {
        const utm = getUtmParams();
        const merged = { ...properties };
        if (utm) merged.utm = utm;
        if (window.screen) merged.screen = `${window.screen.width}x${window.screen.height}`;

        const payload = {
            site_id: siteId,
            event_name: eventName || 'pageview',
            url: getUrl(),
            title: document.title || null,
            hostname: window.location.hostname,
            referrer: getReferrer(),
            session_id: getSessionId(),
            language: navigator.language || navigator.userLanguage,
            properties: Object.keys(merged).length ? merged : {}
        };
        if (globalTag) payload.tag = globalTag;

        // before-send hook
        if (beforeSendFn && typeof window[beforeSendFn] === 'function') {
            const result = window[beforeSendFn](eventName, payload);
            if (result === false || result === null) return;
            if (typeof result === 'object') Object.assign(payload, result);
        }

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

        // Track abandonment
        window.addEventListener('pagehide', () => {
            active.forEach(form => {
                track('form_abandon', { form_id: form.id || form.name || 'unknown' });
            });
        });
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
            navigator.share = async function (data) {
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

    // Video Analytics - Track HTML5 video, YouTube, and Vimeo
    const setupVideoAnalytics = () => {
        const trackedVideos = new WeakSet<HTMLVideoElement>();
        const videoProgress = new Map<string, Set<number>>();
        const progressMilestones = [25, 50, 75];

        // Generate a video ID from element
        const getVideoId = (video: HTMLVideoElement | HTMLIFrameElement): string => {
            return video.id ||
                video.getAttribute('data-video-id') ||
                video.getAttribute('src')?.split('/').pop()?.split('?')[0] ||
                `video_${Math.random().toString(36).slice(2, 8)}`;
        };

        // Get video title
        const getVideoTitle = (video: HTMLVideoElement | HTMLIFrameElement): string => {
            return video.getAttribute('title') ||
                video.getAttribute('data-title') ||
                video.getAttribute('aria-label') ||
                getVideoId(video);
        };

        // Track HTML5 videos
        const trackHTML5Video = (video: HTMLVideoElement) => {
            if (trackedVideos.has(video)) return;
            trackedVideos.add(video);

            const videoId = getVideoId(video);
            const videoTitle = getVideoTitle(video);

            if (!videoProgress.has(videoId)) {
                videoProgress.set(videoId, new Set());
            }

            video.addEventListener('play', () => {
                track('video', {
                    action: 'play',
                    video_id: videoId,
                    video_title: videoTitle,
                    provider: 'html5',
                    duration: Math.round(video.duration) || 0,
                    current_time: Math.round(video.currentTime),
                    url: window.location.pathname
                });
            });

            video.addEventListener('pause', () => {
                // Don't track pause at the very end (it's a completion)
                if (video.currentTime < video.duration - 1) {
                    track('video', {
                        action: 'pause',
                        video_id: videoId,
                        video_title: videoTitle,
                        provider: 'html5',
                        progress: Math.round((video.currentTime / video.duration) * 100),
                        duration: Math.round(video.duration),
                        url: window.location.pathname
                    });
                }
            });

            video.addEventListener('ended', () => {
                track('video', {
                    action: 'complete',
                    video_id: videoId,
                    video_title: videoTitle,
                    provider: 'html5',
                    duration: Math.round(video.duration),
                    url: window.location.pathname
                });
            });

            // Track progress milestones
            video.addEventListener('timeupdate', () => {
                if (!video.duration) return;
                const progress = (video.currentTime / video.duration) * 100;
                const tracked = videoProgress.get(videoId)!;

                progressMilestones.forEach(milestone => {
                    if (progress >= milestone && !tracked.has(milestone)) {
                        tracked.add(milestone);
                        track('video', {
                            action: 'progress',
                            video_id: videoId,
                            video_title: videoTitle,
                            provider: 'html5',
                            progress: milestone,
                            duration: Math.round(video.duration),
                            url: window.location.pathname
                        });
                    }
                });
            });
        };

        // Observe for dynamically added videos
        const observeVideos = () => {
            // Track existing videos
            document.querySelectorAll('video').forEach(trackHTML5Video);

            // Watch for new videos
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLVideoElement) {
                            trackHTML5Video(node);
                        } else if (node instanceof HTMLElement) {
                            node.querySelectorAll('video').forEach(trackHTML5Video);
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        };

        // YouTube API integration
        const setupYouTubeTracking = () => {
            // Listen for YouTube iframe API
            (window as any).onYouTubeIframeAPIReady = () => {
                document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]').forEach((iframe) => {
                    try {
                        const videoId = getVideoId(iframe as HTMLIFrameElement);
                        const videoTitle = getVideoTitle(iframe as HTMLIFrameElement);

                        if (!videoProgress.has(videoId)) {
                            videoProgress.set(videoId, new Set());
                        }

                        const player = new (window as any).YT.Player(iframe, {
                            events: {
                                'onStateChange': (event: any) => {
                                    const states: Record<number, string> = {
                                        1: 'play',
                                        2: 'pause',
                                        0: 'complete'
                                    };
                                    const action = states[event.data];
                                    if (action) {
                                        track('video', {
                                            action,
                                            video_id: videoId,
                                            video_title: videoTitle,
                                            provider: 'youtube',
                                            duration: player.getDuration ? Math.round(player.getDuration()) : 0,
                                            progress: player.getCurrentTime && player.getDuration
                                                ? Math.round((player.getCurrentTime() / player.getDuration()) * 100)
                                                : 0,
                                            url: window.location.pathname
                                        });
                                    }
                                }
                            }
                        });
                    } catch { }
                });
            };

            // Load YouTube API if YouTube iframes exist
            if (document.querySelector('iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]')) {
                if (!(window as any).YT) {
                    const tag = document.createElement('script');
                    tag.src = 'https://www.youtube.com/iframe_api';
                    const firstScript = document.getElementsByTagName('script')[0];
                    firstScript?.parentNode?.insertBefore(tag, firstScript);
                }
            }
        };

        // Vimeo tracking via postMessage
        const setupVimeoTracking = () => {
            const vimeoFrames = document.querySelectorAll('iframe[src*="vimeo.com"]');

            vimeoFrames.forEach((iframe) => {
                const videoId = getVideoId(iframe as HTMLIFrameElement);
                const videoTitle = getVideoTitle(iframe as HTMLIFrameElement);

                if (!videoProgress.has(videoId)) {
                    videoProgress.set(videoId, new Set());
                }

                // Listen for Vimeo player events via postMessage
                window.addEventListener('message', (event) => {
                    if (!event.origin.includes('vimeo.com')) return;

                    try {
                        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                        if (data.event === 'play') {
                            track('video', {
                                action: 'play',
                                video_id: videoId,
                                video_title: videoTitle,
                                provider: 'vimeo',
                                url: window.location.pathname
                            });
                        } else if (data.event === 'pause') {
                            track('video', {
                                action: 'pause',
                                video_id: videoId,
                                video_title: videoTitle,
                                provider: 'vimeo',
                                progress: data.data?.percent ? Math.round(data.data.percent * 100) : 0,
                                url: window.location.pathname
                            });
                        } else if (data.event === 'ended') {
                            track('video', {
                                action: 'complete',
                                video_id: videoId,
                                video_title: videoTitle,
                                provider: 'vimeo',
                                url: window.location.pathname
                            });
                        } else if (data.event === 'playProgress' && data.data?.percent) {
                            const progress = Math.round(data.data.percent * 100);
                            const tracked = videoProgress.get(videoId)!;

                            progressMilestones.forEach(milestone => {
                                if (progress >= milestone && !tracked.has(milestone)) {
                                    tracked.add(milestone);
                                    track('video', {
                                        action: 'progress',
                                        video_id: videoId,
                                        video_title: videoTitle,
                                        provider: 'vimeo',
                                        progress: milestone,
                                        url: window.location.pathname
                                    });
                                }
                            });
                        }
                    } catch { }
                });

                // Enable Vimeo API on iframe
                try {
                    const src = (iframe as HTMLIFrameElement).src;
                    if (!src.includes('api=1')) {
                        (iframe as HTMLIFrameElement).src = src + (src.includes('?') ? '&' : '?') + 'api=1';
                    }
                } catch { }
            });
        };

        // Initialize
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                observeVideos();
                setupYouTubeTracking();
                setupVimeoTracking();
            });
        } else {
            observeVideos();
            setupYouTubeTracking();
            setupVimeoTracking();
        }
    };

    // A/B Testing
    const setupExperiments = (experiments: any[]) => {
        if (!experiments || !experiments.length) return;

        experiments.forEach(exp => {
            // Check targeting (simple path match)
            if (!window.location.pathname.includes(exp.target_url)) return;

            const storageKey = `mm_exp_${exp.id}`;
            let variantId = localStorage.getItem(storageKey);
            let variant = null;

            // Get or assign variant
            if (variantId) {
                variant = exp.variants.find((v: any) => v.id === variantId);
            }

            if (!variant) {
                // Weighted random assignment
                const totalWeight = exp.variants.reduce((sum: number, v: any) => sum + (v.weight || 0), 0);
                let random = Math.random() * totalWeight;
                for (const v of exp.variants) {
                    random -= (v.weight || 0);
                    if (random <= 0) {
                        variant = v;
                        break;
                    }
                }
                if (!variant && exp.variants.length) variant = exp.variants[0]; // Fallback

                if (variant) {
                    localStorage.setItem(storageKey, variant.id);
                    // Send exposure event only on new assignment or first visit in session
                    track('experiment_exposure', {
                        experiment_id: exp.id,
                        experiment_name: exp.name,
                        variant_id: variant.id,
                        variant_name: variant.name,
                        url: window.location.pathname
                    });
                }
            }

            // Apply variant config
            if (variant && variant.config) {
                try {
                    // CSS injection
                    if (variant.config.css) {
                        const style = document.createElement('style');
                        style.textContent = variant.config.css;
                        document.head.appendChild(style);
                    }

                    // JS injection
                    if (variant.config.js) {
                        const script = document.createElement('script');
                        script.textContent = variant.config.js;
                        document.body.appendChild(script);
                    }

                    // Redirect
                    if (variant.config.redirect_url) {
                        window.location.replace(variant.config.redirect_url);
                    }

                    // Element modification (simple text/html replacement)
                    if (variant.config.modifications && Array.isArray(variant.config.modifications)) {
                        variant.config.modifications.forEach((mod: any) => {
                            const el = document.querySelector(mod.selector);
                            if (el) {
                                if (mod.action === 'text') el.textContent = mod.value;
                                if (mod.action === 'html') el.innerHTML = mod.value;
                                if (mod.action === 'style') el.setAttribute('style', mod.value);
                                if (mod.action === 'hide') (el as HTMLElement).style.display = 'none';
                                if (mod.action === 'show') (el as HTMLElement).style.display = '';
                            }
                        });
                    }
                } catch (e) {
                    console.error('Experiment application error:', e);
                }
            }
        });
    };

    // Config injection
    const fetchConfig = () => {
        // Use get-config endpoint
        const configUrl = apiUrl.replace('/track', '/get-config');

        fetch(configUrl, {
            method: 'POST',
            body: JSON.stringify({ site_id: siteId }),
            headers: { 'Content-Type': 'application/json' }
        }).then(r => r.json()).then(d => {
            if (d.visual?.custom_css) {
                const style = document.createElement('style');
                style.textContent = d.visual.custom_css;
                document.head.appendChild(style);
            }

            if (d.experiments) {
                setupExperiments(d.experiments);
            }

            if (d.tags && Array.isArray(d.tags)) {
                d.tags.forEach(t => {
                    try {
                        if (!t.is_enabled && t.is_enabled !== undefined) return;

                        switch (t.type) {
                            case 'custom_html':
                                if (t.config.html) {
                                    const div = document.createElement('div');
                                    div.innerHTML = t.config.html;
                                    // Execute scripts in the HTML
                                    Array.from(div.querySelectorAll('script')).forEach(oldScript => {
                                        const newScript = document.createElement('script');
                                        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                                        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                                        oldScript.parentNode.replaceChild(newScript, oldScript);
                                    });
                                    document.body.appendChild(div);
                                }
                                break;

                            case 'google_analytics':
                                if (t.config.measurementId) {
                                    const id = t.config.measurementId;
                                    const script = document.createElement('script');
                                    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
                                    script.async = true;
                                    document.head.appendChild(script);

                                    window.dataLayer = window.dataLayer || [];
                                    function gtag() { window.dataLayer.push(arguments); }
                                    gtag('js', new Date());
                                    gtag('config', id);
                                }
                                break;

                            case 'facebook_pixel':
                                if (t.config.pixelId) {
                                    const id = t.config.pixelId;
                                    !function (f, b, e, v, n, t, s) {
                                        if (f.fbq) return; n = f.fbq = function () {
                                            n.callMethod ?
                                                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                                        };
                                        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                                        n.queue = []; t = b.createElement(e); t.async = !0;
                                        t.src = v; s = b.getElementsByTagName(e)[0];
                                        s.parentNode.insertBefore(t, s)
                                    }(window, document, 'script',
                                        'https://connect.facebook.net/en_US/fbevents.js');
                                    fbq('init', id);
                                    fbq('track', 'PageView');
                                }
                                break;

                            case 'google_tag_manager':
                                if (t.config.containerId) {
                                    const id = t.config.containerId;
                                    (function (w, d, s, l, i) {
                                        w[l] = w[l] || []; w[l].push({
                                            'gtm.start':
                                                new Date().getTime(), event: 'gtm.js'
                                        }); var f = d.getElementsByTagName(s)[0],
                                            j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
                                                'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
                                    })(window, document, 'script', 'dataLayer', id);
                                }
                                break;

                            case 'custom_script':
                                if (t.config.url) {
                                    const s = document.createElement('script');
                                    s.src = t.config.url;
                                    s.async = true;
                                    document.head.appendChild(s);
                                }
                                break;
                        }
                    } catch (e) {
                        console.error('Error injecting tag:', t.name, e);
                    }
                });
            }
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

    // Heatmap Click Tracking
    const setupHeatmapTracking = () => {
        // Debounce to prevent spam
        let clickBuffer: Array<{ x: number; y: number; vw: number; vh: number; selector: string; text: string }> = [];
        let flushTimeout: ReturnType<typeof setTimeout> | null = null;

        const getElementSelector = (el: Element): string => {
            if (el.id) return `#${el.id}`;
            if (el.className && typeof el.className === 'string') {
                const classes = el.className.trim().split(/\s+/).slice(0, 3).join('.');
                if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
            }
            return el.tagName.toLowerCase();
        };

        const getElementText = (el: Element): string => {
            const text = (el.textContent || '').trim().substring(0, 50);
            return text.replace(/\s+/g, ' ');
        };

        const flushClicks = () => {
            if (clickBuffer.length === 0) return;

            // Send batch of clicks
            const payload = {
                site_id: siteId,
                event_name: 'heatmap_click',
                url: window.location.pathname,
                session_id: getSessionId(),
                properties: {
                    clicks: clickBuffer,
                    page_height: Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight
                    )
                }
            };

            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
                navigator.sendBeacon(apiUrl, blob);
            } else {
                fetch(apiUrl, { method: 'POST', body: JSON.stringify(payload), keepalive: true }).catch(() => { });
            }

            clickBuffer = [];
        };

        document.addEventListener('click', (e) => {
            const target = e.target as Element;
            if (!target) return;

            // Get position relative to document (not viewport)
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;

            clickBuffer.push({
                x: Math.round(e.clientX + scrollX),
                y: Math.round(e.clientY + scrollY),
                vw: window.innerWidth,
                vh: window.innerHeight,
                selector: getElementSelector(target),
                text: getElementText(target)
            });

            // Debounce: flush after 2 seconds of no clicks, or if buffer is full
            if (flushTimeout) clearTimeout(flushTimeout);
            if (clickBuffer.length >= 20) {
                flushClicks();
            } else {
                flushTimeout = setTimeout(flushClicks, 2000);
            }
        }, true);

        // Flush on page hide
        window.addEventListener('pagehide', flushClicks);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) flushClicks();
        });
    };

    // Heatmap Scroll Tracking
    const setupScrollHeatmap = () => {
        const scrollDepths = new Set<number>();
        let lastScrollTime = 0;
        const SCROLL_THROTTLE = 1000; // 1 second

        const trackScrollPosition = () => {
            const now = Date.now();
            if (now - lastScrollTime < SCROLL_THROTTLE) return;
            lastScrollTime = now;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const clientHeight = window.innerHeight;
            const scrollHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            );

            // Calculate percentage (0-100)
            const maxScroll = scrollHeight - clientHeight;
            if (maxScroll <= 0) return;

            const scrollPercent = Math.min(100, Math.round((scrollTop / maxScroll) * 100));

            // Track every 10% milestone
            const milestone = Math.floor(scrollPercent / 10) * 10;
            if (milestone > 0 && !scrollDepths.has(milestone)) {
                scrollDepths.add(milestone);
                track('heatmap_scroll', {
                    percent: milestone,
                    scroll_y: Math.round(scrollTop),
                    page_height: scrollHeight,
                    viewport_height: clientHeight,
                    url: window.location.pathname
                });
            }
        };

        window.addEventListener('scroll', trackScrollPosition, { passive: true });
        setTimeout(trackScrollPosition, 1000);
    };

    // Session Recording using rrweb-compatible DOM snapshots
    const setupSessionRecording = () => {
        const recordingEnabled = script?.getAttribute('data-recording') === 'true';
        if (!recordingEnabled) return;

        const recordingApiUrl = script?.getAttribute('data-recording-api');
        if (!recordingApiUrl) return;

        const events: any[] = [];
        let pagesList: string[] = [window.location.pathname];

        // Simplified DOM snapshot (type 2 = full snapshot)
        const takeSnapshot = () => {
            const html = document.documentElement.outerHTML;
            events.push({
                type: 2,
                data: { html },
                timestamp: Date.now(),
            });
        };

        // Track mouse movements (type 3, source 1)
        let lastMouseTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMouseTime < 100) return; // throttle 100ms
            lastMouseTime = now;
            events.push({
                type: 3,
                data: { source: 1, positions: [{ x: e.clientX, y: e.clientY }] },
                timestamp: now,
            });
        }, { passive: true });

        // Track clicks (type 3, source 2)
        document.addEventListener('click', (e) => {
            events.push({
                type: 3,
                data: { source: 2, x: e.clientX, y: e.clientY },
                timestamp: Date.now(),
            });
        }, true);

        // Track scrolls (type 3, source 3)
        let lastScrollRecordTime = 0;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollRecordTime < 200) return;
            lastScrollRecordTime = now;
            events.push({
                type: 3,
                data: { source: 3, x: window.scrollX, y: window.scrollY },
                timestamp: now,
            });
        }, { passive: true });

        // Track input changes (type 3, source 5) - sanitized
        document.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (!target) return;
            const isSensitive = target.type === 'password' || target.type === 'email' || target.name?.includes('card');
            events.push({
                type: 3,
                data: { source: 5, text: isSensitive ? '***' : (target.value || '').substring(0, 100), id: target.id || target.name },
                timestamp: Date.now(),
            });
        }, true);

        // Track DOM mutations via MutationObserver (simplified incremental)
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    events.push({
                        type: 3,
                        data: { source: 0, type: mutation.type },
                        timestamp: Date.now(),
                    });
                    break; // batch into single event per mutation batch
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });

        // Track page navigations
        const origPush = window.history.pushState;
        window.history.pushState = function () {
            origPush.apply(this, arguments as any);
            pagesList.push(window.location.pathname);
            takeSnapshot(); // snapshot on navigation
        };

        // Take initial snapshot
        takeSnapshot();

        // Flush recording data periodically and on page exit
        const flushRecording = () => {
            if (events.length < 2) return; // need at least snapshot + something

            const duration = events.length > 1
                ? Math.round((events[events.length - 1].timestamp - events[0].timestamp) / 1000)
                : 0;

            const payload = {
                site_id: siteId,
                session_id: getSessionId(),
                visitor_id: null, // server generates
                events: events.splice(0), // drain
                metadata: {
                    url: window.location.pathname,
                    pages: [...new Set(pagesList)],
                    duration,
                    browser: navigator.userAgent,
                    device_type: /Mobile/i.test(navigator.userAgent) ? 'mobile' : /Tablet|iPad/i.test(navigator.userAgent) ? 'tablet' : 'desktop',
                },
            };

            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(recordingApiUrl, blob);
            } else {
                fetch(recordingApiUrl, { method: 'POST', body: JSON.stringify(payload), keepalive: true }).catch(() => { });
            }
        };

        // Flush every 30 seconds
        setInterval(flushRecording, 30000);

        // Flush on page exit
        window.addEventListener('pagehide', flushRecording);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) flushRecording();
        });
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
        setupVideoAnalytics();
        setupHeatmapTracking();
        setupScrollHeatmap();
        setupSessionRecording();
        fetchConfig();
        setTimeout(() => {
            if (document.title.toLowerCase().includes('404')) track('404', { url: window.location.href, referrer: document.referrer });
        }, 1000);
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);

})();
