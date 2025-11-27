import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking for SLA breaches and escalations...");

    // Get unresolved team assignments with their classifications
    const { data: assignments } = await supabase
      .from("team_assignments")
      .select(`
        *,
        emails!inner(id, subject, received_at),
        email_classifications!inner(request_type_id, urgency_level)
      `)
      .eq("resolved", false);

    if (!assignments || assignments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, escalated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let escalatedCount = 0;

    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const now = new Date();
      const hoursElapsed = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);

      // Get request type to check SLA
      const { data: requestType } = await supabase
        .from("request_types")
        .select("*")
        .eq("id", assignment.email_classifications.request_type_id)
        .single();

      if (!requestType) continue;

      const slaHours = requestType.sla_hours || 24;
      const escalationRules = requestType.escalation_rules as any;

      // Check if SLA breached
      if (hoursElapsed >= slaHours) {
        console.log(`SLA breach detected for assignment ${assignment.id}`);

        // Check if already escalated
        const { data: existingEscalation } = await supabase
          .from("escalations")
          .select("id")
          .eq("team_assignment_id", assignment.id)
          .single();

        if (existingEscalation) {
          console.log("Already escalated, skipping");
          continue;
        }

        // Create escalation
        await supabase.from("escalations").insert({
          email_id: assignment.email_id,
          team_assignment_id: assignment.id,
          reason: `SLA breach: ${hoursElapsed.toFixed(1)} hours elapsed, SLA is ${slaHours} hours`,
          escalated_to: escalationRules?.escalate_to || "Operations Manager",
        });

        // Mark classification as escalated
        await supabase
          .from("email_classifications")
          .update({
            escalated: true,
            escalation_time: now.toISOString(),
          })
          .eq("email_id", assignment.email_id);

        escalatedCount++;
        console.log(`Escalated assignment ${assignment.id}`);
      }
    }

    console.log(`Escalation check complete. Escalated ${escalatedCount} assignments.`);

    return new Response(
      JSON.stringify({ success: true, escalated: escalatedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in check-escalations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
