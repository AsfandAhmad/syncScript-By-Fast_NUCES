// supabase/functions/activity-logger/index.ts
// Edge Function for logging activities with additional enrichment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

interface ActivityLogRequest {
  vault_id: string;
  action_type: string;
  actor_id?: string;
  metadata?: Record<string, any>;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { vault_id, action_type, actor_id, metadata } =
      (await req.json()) as ActivityLogRequest;

    if (!vault_id || !action_type) {
      return new Response(
        JSON.stringify({ error: "vault_id and action_type are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Insert activity log
    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        vault_id,
        action_type,
        actor_id,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
