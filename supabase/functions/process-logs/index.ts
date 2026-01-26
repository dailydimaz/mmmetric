import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { import_id } = await req.json();

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

        // update status to processing
        await supabase.from('log_imports').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', import_id);

        // 2. Download file
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('log-imports')
            .download(importRecord.file_url);

        if (downloadError) throw downloadError;

        const text = await fileData.text();
        const lines = text.split('\n');
        let processed = 0;
        let failed = 0;

        // 3. Process lines (Simplified for demo)
        // Assume CSV: timestamp,url,user_agent
        for (const line of lines) {
            if (!line.trim()) continue;

            try {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    // Rudimentary parsing 
                    // In production, use comprehensive log parser libraries
                    const event = {
                        site_id: importRecord.site_id,
                        event_name: 'pageview', // Assume pageview for logs
                        url: parts[1] || '/',
                        visitor_id: 'imported_user', // Placeholder
                        session_id: 'imported_session',
                        created_at: new Date(parts[0]).toISOString(), // Try to parse timestamp
                        // Add tag imported=true
                        properties: { imported: true, source: 'log_import' }
                    };

                    await supabase.from('events').insert(event);
                    processed++;
                }
            } catch (e) {
                failed++;
            }
        }

        // 4. Update status
        await supabase.from('log_imports').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            rows_processed: processed,
            rows_failed: failed
        }).eq('id', import_id);

        return new Response(JSON.stringify({ success: true, processed }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        // Log error to DB if possible
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
