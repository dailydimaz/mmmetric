import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface HeatmapViewProps {
    siteId: string;
}

export function HeatmapView({ siteId }: HeatmapViewProps) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [points, setPoints] = useState<Array<{ x: number, y: number, value: number }>>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fetchHeatmapData = async () => {
        if (!url) return;
        setLoading(true);
        try {
            // 1. Fetch clicks for this URL
            // Note: We need to match URL strictly or loosely?
            // For now, strict match on pathname
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;

            const { data, error } = await supabase
                .from('heatmap_clicks')
                .select('x, y')
                .eq('site_id', siteId)
                .ilike('url', `%${pathname}%`) // Loose match
                .limit(1000); // Limit points for performance

            if (error) throw error;

            const pts = data.map(d => ({ x: d.x, y: d.y, value: 1 }));
            setPoints(pts);
            drawHeatmap(pts);
        } catch (e) {
            console.error('Error fetching heatmap:', e);
        } finally {
            setLoading(false);
        }
    };

    const drawHeatmap = (dataPoints: Array<{ x: number, y: number, value: number }>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Simple dot rendering for MVP
        // Heatmap libraries like simpleheat are better but require external dependency
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';

        dataPoints.forEach(p => {
            ctx.beginPath();
            // Scale coordinates if needed? 
            // We assume 1:1 for now, but in reality we need to scale based on viewport width
            // For MVP, we just plot raw X/Y.
            ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
            ctx.fill();
        });
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Heatmaps</CardTitle>
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter page URL (e.g. https://yoursite.com/)"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                    />
                    <Button onClick={fetchHeatmapData} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'Load Heatmap'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="relative h-[600px] overflow-auto border rounded-md p-0">
                {/* Iframe for context */}
                {url && (
                    <iframe
                        src={url}
                        className="w-full h-full absolute top-0 left-0 border-none"
                        style={{ pointerEvents: 'none', opacity: 0.5 }} // Disable interaction to allow canvas overlay logic? No, we want overlay on top.
                    // Note: This will fail if site creates X-Frame-Options
                    />
                )}

                {/* Canvas Overlay */}
                <canvas
                    ref={canvasRef}
                    width={1280}
                    height={2000}
                    className="absolute top-0 left-0 z-10 pointer-events-none"
                />
            </CardContent>
        </Card>
    );
}
