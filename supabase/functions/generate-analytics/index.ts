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

    const today = new Date().toISOString().split("T")[0];
    console.log(`Generating analytics for ${today}`);

    // Count total emails processed today
    const { count: totalEmails } = await supabase
      .from("emails")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // Count auto-classified emails
    const { count: autoClassified } = await supabase
      .from("email_classifications")
      .select("*", { count: "exact", head: true })
      .gte("classified_at", today);

    // Count auto-replied emails
    const { count: autoReplied } = await supabase
      .from("auto_replies")
      .select("*", { count: "exact", head: true })
      .gte("sent_at", today);

    // Count escalations
    const { count: escalated } = await supabase
      .from("escalations")
      .select("*", { count: "exact", head: true })
      .gte("escalated_at", today);

    // Calculate average response time
    const { data: resolvedAssignments } = await supabase
      .from("team_assignments")
      .select("assigned_at, resolved_at")
      .eq("resolved", true)
      .gte("resolved_at", today);

    let avgResponseTime = 0;
    if (resolvedAssignments && resolvedAssignments.length > 0) {
      const totalMinutes = resolvedAssignments.reduce((sum, assignment) => {
        const assigned = new Date(assignment.assigned_at).getTime();
        const resolved = new Date(assignment.resolved_at).getTime();
        return sum + (resolved - assigned) / (1000 * 60);
      }, 0);
      avgResponseTime = totalMinutes / resolvedAssignments.length;
    }

    // Get request types breakdown
    const { data: classifications } = await supabase
      .from("email_classifications")
      .select(`
        request_type_id,
        request_types(name)
      `)
      .gte("classified_at", today);

    const requestTypesBreakdown: Record<string, number> = {};
    classifications?.forEach((c: any) => {
      const name = c.request_types?.name || "Unknown";
      requestTypesBreakdown[name] = (requestTypesBreakdown[name] || 0) + 1;
    });

    // Get team performance
    const { data: teamAssignments } = await supabase
      .from("team_assignments")
      .select("team_name, resolved")
      .gte("assigned_at", today);

    const teamPerformance: Record<string, any> = {};
    teamAssignments?.forEach((assignment) => {
      if (!teamPerformance[assignment.team_name]) {
        teamPerformance[assignment.team_name] = { total: 0, resolved: 0 };
      }
      teamPerformance[assignment.team_name].total++;
      if (assignment.resolved) {
        teamPerformance[assignment.team_name].resolved++;
      }
    });

    // Count SLA breaches
    const { count: slaBreaches } = await supabase
      .from("escalations")
      .select("*", { count: "exact", head: true })
      .gte("escalated_at", today)
      .ilike("reason", "%SLA breach%");

    // Insert or update analytics
    const { error: upsertError } = await supabase
      .from("analytics_metrics")
      .upsert({
        metric_date: today,
        total_emails: totalEmails || 0,
        auto_classified: autoClassified || 0,
        auto_replied: autoReplied || 0,
        escalated: escalated || 0,
        avg_response_time_minutes: avgResponseTime,
        sla_breaches: slaBreaches || 0,
        request_types_breakdown: requestTypesBreakdown,
        team_performance: teamPerformance,
      });

    if (upsertError) {
      throw upsertError;
    }

    console.log("Analytics generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        metrics: {
          totalEmails: totalEmails || 0,
          autoClassified: autoClassified || 0,
          autoReplied: autoReplied || 0,
          escalated: escalated || 0,
          avgResponseTime,
          slaBreaches: slaBreaches || 0,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-analytics:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
