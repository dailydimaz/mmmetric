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

        const { site_id } = await req.json();

        if (!site_id) {
            throw new Error("site_id is required");
        }

        // 1. Get Tags
        const { data: tags, error: tagsError } = await supabase
            .from('tags')
            .select('type, config, load_priority')
            .eq('site_id', site_id) // This assumes site_id passed is the UUID from `sites` table, but tracker passes `st_...`.
            // We need to resolve `st_...` to UUID first?
            // Wait, `sites` table has `tracking_id` which usually is `st_...`.
            // Let's check schema.
            .eq('is_enabled', true)
            .order('load_priority', { ascending: true });

        // Actually, site_id from tracker is `st_...` (tracking_id).
        // The `tags` table uses `site_id` (UUID).
        // So we need to join or find site first.

        // Fetch site UUID from tracking_id
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .select('id, custom_css') // Also return custom_css for white labeling injection if needed
            .eq('tracking_id', site_id)
            .single();

        if (siteError || !site) {
            return new Response(JSON.stringify({ error: "Site not found" }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Now fetch tags using UUID
        const { data: validTags } = await supabase
            .from('tags')
            .select('type, config')
            .eq('site_id', site.id)
            .eq('is_enabled', true)
            .order('load_priority', { ascending: true });


        // 2. Get Active Experiments
        const { data: experiments } = await supabase
            .from('experiments')
            .select('id, name, variants:experiment_variants(id, name, config, weight)')
            .eq('site_id', site.id)
            .eq('status', 'active');

        return new Response(JSON.stringify({
            tags: validTags || [],
            experiments: experiments || [],
            visual: {
                custom_css: site.custom_css
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
