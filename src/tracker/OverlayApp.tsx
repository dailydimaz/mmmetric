import React, { useState, useEffect } from 'react';

// Helpers to get configuration
const getScriptConfig = () => {
    // Default to env vars if available (replaced by Vite during build)
    let apiUrl = import.meta.env.VITE_SUPABASE_URL + '/rest/v1/rpc/get_overlay_stats';
    let apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const script = document.querySelector('script[src*="overlay.js"]');
    if (script) {
        // Allow overriding via data attribute
        const dataApi = script.getAttribute('data-api');
        if (dataApi) apiUrl = dataApi + '/rpc/get_overlay_stats';
    }

    // Get tracking ID from URL param or script attribute
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('mm_tracking_id') || script?.getAttribute('data-tracking-id') || '';

    return { apiUrl, apiKey, trackingId };
};

interface OverlayStats {
    visitors: number;
    pageviews: number;
    top_referrers: Array<{ referrer: string; count: number }>;
}

export function OverlayApp() {
    const [isVisible, setIsVisible] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [stats, setStats] = useState<OverlayStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState('7d');

    useEffect(() => {
        const fetchStats = async () => {
            const { apiUrl, apiKey, trackingId } = getScriptConfig();
            if (!trackingId) {
                setError('No tracking ID found');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': apiKey,
                    },
                    body: JSON.stringify({
                        _tracking_id: trackingId,
                        _url_path: window.location.pathname,
                        _period: period
                    })
                });

                if (!response.ok) throw new Error('Failed to fetch stats');
                const data = await response.json();
                // RPC returns an array
                if (Array.isArray(data) && data.length > 0) {
                    setStats(data[0]);
                } else {
                    setStats({ visitors: 0, pageviews: 0, top_referrers: [] });
                }
            } catch (err) {
                console.error('Overlay error:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        if (isVisible) fetchStats();
    }, [isVisible, period]);

    if (!isVisible) return null;

    if (isMinimized) {
        return (
            <div
                onClick={() => setIsMinimized(false)}
                style={{
                    position: 'fixed', bottom: '20px', right: '20px', zIndex: 999999,
                    background: 'white', padding: '8px', borderRadius: '50%',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)', cursor: 'pointer',
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                📊
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 999999,
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            maxWidth: '300px',
            width: '100%',
            color: '#333'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Page Analytics</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setIsMinimized(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>_</button>
                    <button onClick={() => setIsVisible(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', lineHeight: '14px' }}>&times;</button>
                </div>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '6px' }}>
                {['today', '7d', '30d'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                            border: '1px solid #ddd',
                            background: period === p ? '#eee' : 'white',
                            cursor: 'pointer'
                        }}
                    >
                        {p === 'today' ? 'Today' : p.toUpperCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '10px' }}>Loading...</div>
            ) : error ? (
                <div style={{ fontSize: '12px', color: 'red' }}>{error}</div>
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: 700 }}>{stats?.visitors.toLocaleString()}</div>
                            <div style={{ fontSize: '10px', color: '#666' }}>Visitors</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: 700 }}>{stats?.pageviews.toLocaleString()}</div>
                            <div style={{ fontSize: '10px', color: '#666' }}>Pageviews</div>
                        </div>
                    </div>

                    {stats?.top_referrers && stats.top_referrers.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Top Referrers</div>
                            {stats.top_referrers.slice(0, 3).map((r, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{r.referrer || 'Direct'}</span>
                                    <span style={{ color: '#666' }}>{r.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
