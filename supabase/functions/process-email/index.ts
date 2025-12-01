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
    const { emailId, userId } = await req.json();
    console.log("Processing email:", emailId, "for user:", userId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the email
    const { data: email, error: fetchError } = await supabase
      .from("emails")
      .select("*")
      .eq("id", emailId)
      .single();

    if (fetchError || !email) {
      throw new Error("Email not found");
    }

    console.log("Email fetched:", email.subject);

    // Call AI to classify the email
    const classificationPrompt = `Analyze this email and provide a JSON response with the following structure:
{
  "requestType": "one of: Leave Request, Access Request, IT Support, HR Query, Meeting Request, Task Assignment, External Communication, Urgent Escalation, Information Request, General",
  "urgencyLevel": "one of: low, medium, high, critical",
  "sentiment": "one of: positive, neutral, negative",
  "summary": "2-3 sentence summary of the email",
  "suggestedTeam": "one of: HR, IT, Management, Operations, Finance, General",
  "containsTask": true/false,
  "taskDescription": "if containsTask is true, describe the task",
  "suggestedReply": "a professional auto-reply acknowledging the email"
}

Email Details:
From: ${email.sender}
Subject: ${email.subject}
Body: ${email.body}

Respond ONLY with valid JSON, no markdown or explanation.`;

    let classification = {
      requestType: "General",
      urgencyLevel: "medium",
      sentiment: "neutral",
      summary: `Email from ${email.sender} regarding ${email.subject}`,
      suggestedTeam: "General",
      containsTask: false,
      taskDescription: "",
      suggestedReply: `Thank you for your email regarding "${email.subject}". We have received your message and will respond shortly.`,
    };

    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are an AI email classifier for office automation. Always respond with valid JSON only." },
              { role: "user", content: classificationPrompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          console.log("AI Response:", content);
          
          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            classification = { ...classification, ...JSON.parse(jsonMatch[0]) };
          }
        }
      } catch (aiError) {
        console.error("AI classification error:", aiError);
      }
    }

    console.log("Classification:", classification);

    // Update email with summary
    await supabase
      .from("emails")
      .update({
        summary: classification.summary,
        is_processed: true,
        has_task: classification.containsTask,
      })
      .eq("id", emailId);

    // Create email classification record
    const { data: requestType } = await supabase
      .from("request_types")
      .select("id")
      .eq("name", classification.requestType)
      .single();

    const { error: classError } = await supabase.from("email_classifications").insert({
      email_id: emailId,
      request_type_id: requestType?.id || null,
      urgency_level: classification.urgencyLevel,
      routing_team: classification.suggestedTeam,
      confidence_score: 0.85,
      auto_reply_sent: false,
    });

    if (classError) console.error("Classification insert error:", classError);

    // Create task if needed
    let taskCreated = false;
    if (classification.containsTask && classification.taskDescription) {
      const { error: taskError } = await supabase.from("tasks").insert({
        user_id: userId,
        email_id: emailId,
        title: classification.taskDescription.substring(0, 100),
        description: classification.taskDescription,
        priority: classification.urgencyLevel === "critical" ? "high" : classification.urgencyLevel,
        status: "pending",
      });

      if (!taskError) {
        taskCreated = true;
        console.log("Task created");
      } else {
        console.error("Task creation error:", taskError);
      }
    }

    // Create team assignment
    await supabase.from("team_assignments").insert({
      email_id: emailId,
      team_name: classification.suggestedTeam,
    });

    // Store auto-reply draft
    let autoReplyGenerated = false;
    if (classification.suggestedReply) {
      const { error: replyError } = await supabase.from("auto_replies").insert({
        email_id: emailId,
        recipient: email.sender,
        reply_text: classification.suggestedReply,
      });

      if (!replyError) {
        autoReplyGenerated = true;
        console.log("Auto-reply generated");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        classification,
        taskCreated,
        autoReplyGenerated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});