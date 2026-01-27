import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Apache/Nginx Combined Log Format regex
// Example: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"
const COMBINED_LOG_REGEX = /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+[^"]+"\s+(\d+)\s+(\d+|-)\s+"([^"]*)"\s+"([^"]*)"/;

// Apache/Nginx Common Log Format regex
// Example: 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
const COMMON_LOG_REGEX = /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+[^"]+"\s+(\d+)\s+(\d+|-)/;

// IIS Log Format (W3C Extended) - space-delimited
// Example: 2023-01-15 12:30:45 192.168.1.1 GET /page.html - 80 - 10.0.0.1 Mozilla/5.0... 200 0 0 125
const IIS_LOG_REGEX = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+)\s+(\S+)\s+\S+\s+\d+\s+\S+\s+(\S+)\s+([^\s]+)\s+\S*\s*(\d+)/;

interface ParsedLogEntry {
    ip: string;
    timestamp: Date;
    method: string;
    url: string;
    statusCode: number;
    userAgent: string;
    referrer: string;
}

function parseLogDate(dateStr: string): Date {
    // Apache/Nginx format: 10/Oct/2000:13:55:36 -0700
    const months: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const match = dateStr.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
        const [, day, monthStr, year, hour, min, sec] = match;
        return new Date(parseInt(year), months[monthStr], parseInt(day), parseInt(hour), parseInt(min), parseInt(sec));
    }
    
    // Fallback to standard parsing
    return new Date(dateStr);
}

function parseCombinedLog(line: string): ParsedLogEntry | null {
    const match = line.match(COMBINED_LOG_REGEX);
    if (!match) return null;
    
    const [, ip, , dateStr, method, url, statusCode, , referrer, userAgent] = match;
    return {
        ip,
        timestamp: parseLogDate(dateStr),
        method,
        url,
        statusCode: parseInt(statusCode),
        userAgent: userAgent || '',
        referrer: referrer === '-' ? '' : referrer,
    };
}

function parseCommonLog(line: string): ParsedLogEntry | null {
    const match = line.match(COMMON_LOG_REGEX);
    if (!match) return null;
    
    const [, ip, , dateStr, method, url, statusCode] = match;
    return {
        ip,
        timestamp: parseLogDate(dateStr),
        method,
        url,
        statusCode: parseInt(statusCode),
        userAgent: '',
        referrer: '',
    };
}

function parseIISLog(line: string): ParsedLogEntry | null {
    // Skip comment lines
    if (line.startsWith('#')) return null;
    
    const match = line.match(IIS_LOG_REGEX);
    if (!match) return null;
    
    const [, date, time, , method, url, ip, userAgent, statusCode] = match;
    return {
        ip,
        timestamp: new Date(`${date}T${time}Z`),
        method,
        url,
        statusCode: parseInt(statusCode),
        userAgent: userAgent === '-' ? '' : decodeURIComponent(userAgent.replace(/\+/g, ' ')),
        referrer: '',
    };
}

function parseCSVLog(line: string, headers: string[]): ParsedLogEntry | null {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 2) return null;
    
    // Try to map common header names
    const getField = (names: string[]): string => {
        for (const name of names) {
            const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
            if (idx >= 0 && parts[idx]) return parts[idx];
        }
        return '';
    };
    
    const timestamp = getField(['timestamp', 'date', 'time', 'datetime']);
    const url = getField(['url', 'path', 'uri', 'request']);
    
    if (!timestamp || !url) return null;
    
    return {
        ip: getField(['ip', 'client', 'remote', 'address']) || 'unknown',
        timestamp: new Date(timestamp),
        method: getField(['method']) || 'GET',
        url,
        statusCode: parseInt(getField(['status', 'code', 'response'])) || 200,
        userAgent: getField(['user_agent', 'useragent', 'agent', 'browser']),
        referrer: getField(['referrer', 'referer']),
    };
}

function detectBrowser(userAgent: string): string {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    if (ua.includes('msie') || ua.includes('trident')) return 'IE';
    return 'Other';
}

function detectOS(userAgent: string): string {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os') || ua.includes('macos')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Other';
}

function detectDeviceType(userAgent: string): string {
    if (!userAgent) return 'desktop';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    return 'desktop';
}

function generateVisitorId(ip: string, userAgent: string): string {
    // Create a simple hash for visitor grouping
    const str = `${ip}_${userAgent}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `imported_${Math.abs(hash).toString(36)}`;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let importId: string | null = null;

    try {
        const { import_id, format = 'auto' } = await req.json();
        importId = import_id;

        if (!import_id) {
            throw new Error("import_id is required");
        }

        // 1. Get import record
        const { data: importRecord, error: fetchError } = await supabase
            .from('log_imports')
            .select('*')
            .eq('id', import_id)
            .single();

        if (fetchError || !importRecord) throw new Error("Import record not found");

        // Update status to processing
        await supabase.from('log_imports').update({ 
            status: 'processing', 
            started_at: new Date().toISOString() 
        }).eq('id', import_id);

        // 2. Download file
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('log-imports')
            .download(importRecord.file_url);

        if (downloadError) throw downloadError;

        const text = await fileData.text();
        const lines = text.split('\n').filter(l => l.trim());
        let processed = 0;
        let failed = 0;
        const batchSize = 100;
        let eventBatch: any[] = [];

        // Detect format from first non-comment line
        let detectedFormat = format;
        let csvHeaders: string[] = [];
        
        if (format === 'auto') {
            for (const line of lines) {
                if (line.startsWith('#')) continue;
                
                if (COMBINED_LOG_REGEX.test(line)) {
                    detectedFormat = 'combined';
                } else if (COMMON_LOG_REGEX.test(line)) {
                    detectedFormat = 'common';
                } else if (IIS_LOG_REGEX.test(line)) {
                    detectedFormat = 'iis';
                } else if (line.includes(',')) {
                    detectedFormat = 'csv';
                    csvHeaders = line.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                }
                break;
            }
        }

        // 3. Process lines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim() || line.startsWith('#')) continue;

            // Skip CSV header row
            if (detectedFormat === 'csv' && i === 0) {
                csvHeaders = line.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                continue;
            }

            try {
                let entry: ParsedLogEntry | null = null;

                switch (detectedFormat) {
                    case 'combined':
                        entry = parseCombinedLog(line);
                        break;
                    case 'common':
                        entry = parseCommonLog(line);
                        break;
                    case 'iis':
                        entry = parseIISLog(line);
                        break;
                    case 'csv':
                        entry = parseCSVLog(line, csvHeaders);
                        break;
                    default:
                        // Try each format
                        entry = parseCombinedLog(line) || parseCommonLog(line) || parseIISLog(line);
                }

                if (!entry || !entry.timestamp || isNaN(entry.timestamp.getTime())) {
                    failed++;
                    continue;
                }

                // Skip non-GET requests and non-200 responses for pageviews
                if (entry.method !== 'GET' || (entry.statusCode < 200 || entry.statusCode >= 400)) {
                    continue;
                }

                // Skip static assets
                if (/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(entry.url)) {
                    continue;
                }

                const visitorId = generateVisitorId(entry.ip, entry.userAgent);

                const event = {
                    site_id: importRecord.site_id,
                    event_name: 'pageview',
                    url: entry.url,
                    visitor_id: visitorId,
                    session_id: `${visitorId}_${entry.timestamp.toISOString().split('T')[0]}`,
                    created_at: entry.timestamp.toISOString(),
                    referrer: entry.referrer || null,
                    browser: detectBrowser(entry.userAgent),
                    os: detectOS(entry.userAgent),
                    device_type: detectDeviceType(entry.userAgent),
                    properties: { imported: true, source: 'log_import', format: detectedFormat }
                };

                eventBatch.push(event);

                // Insert in batches
                if (eventBatch.length >= batchSize) {
                    const { error: insertError } = await supabase.from('events').insert(eventBatch);
                    if (insertError) {
                        failed += eventBatch.length;
                    } else {
                        processed += eventBatch.length;
                    }
                    eventBatch = [];
                }
            } catch (e) {
                failed++;
            }
        }

        // Insert remaining events
        if (eventBatch.length > 0) {
            const { error: insertError } = await supabase.from('events').insert(eventBatch);
            if (insertError) {
                failed += eventBatch.length;
            } else {
                processed += eventBatch.length;
            }
        }

        // 4. Update status
        await supabase.from('log_imports').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            rows_processed: processed,
            rows_failed: failed
        }).eq('id', import_id);

        return new Response(JSON.stringify({ success: true, processed, failed, format: detectedFormat }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        // Update status to failed
        if (importId) {
            await supabase.from('log_imports').update({
                status: 'failed',
                error_message: error.message,
                completed_at: new Date().toISOString()
            }).eq('id', importId);
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
