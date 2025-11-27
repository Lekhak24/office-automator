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
    const { emailId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Classifying email: ${emailId}`);

    // Get email
    const { data: email } = await supabase
      .from("emails")
      .select("*")
      .eq("id", emailId)
      .single();

    if (!email) {
      throw new Error("Email not found");
    }

    // Get request types
    const { data: requestTypes } = await supabase
      .from("request_types")
      .select("*");

    // Build classification prompt
    const requestTypeInfo = requestTypes?.map(rt => 
      `- ${rt.name} (${rt.category}): keywords: ${rt.keywords?.join(", ")}`
    ).join("\n") || "";

    const prompt = `Analyze this email and classify it into one of the request types.

Email Subject: ${email.subject}
Email Body: ${email.body?.substring(0, 1000)}

Available Request Types:
${requestTypeInfo}

Determine:
1. Which request type best matches this email
2. Urgency level (low, medium, high, critical) - Check for words like "urgent", "critical", "blocked", "emergency"
3. Brief summary of the request

Respond in JSON format:
{
  "requestType": "exact name from list",
  "urgencyLevel": "low|medium|high|critical",
  "summary": "brief summary",
  "confidence": 0.0-1.0
}`;

    // Call AI for classification
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert email classifier for office automation. Respond only in valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "{}";
    
    // Parse AI response
    let classification;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      classification = JSON.parse(jsonMatch ? jsonMatch[0] : aiContent);
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      classification = {
        requestType: "Technical Issue",
        urgencyLevel: "medium",
        summary: email.subject,
        confidence: 0.5,
      };
    }

    console.log("Classification result:", classification);

    // Find matching request type
    const matchedType = requestTypes?.find(
      rt => rt.name === classification.requestType
    );

    if (!matchedType) {
      console.error("Request type not found:", classification.requestType);
    }

    // Store classification
    const { data: emailClassification } = await supabase
      .from("email_classifications")
      .insert({
        email_id: emailId,
        request_type_id: matchedType?.id,
        confidence_score: classification.confidence || 0.8,
        urgency_level: classification.urgencyLevel || "medium",
        routing_team: matchedType?.routing_team,
      })
      .select()
      .single();

    // Update email with summary
    await supabase
      .from("emails")
      .update({
        summary: classification.summary,
        has_task: true,
        is_processed: true,
      })
      .eq("id", emailId);

    // Create team assignment
    if (matchedType) {
      await supabase.from("team_assignments").insert({
        email_id: emailId,
        team_name: matchedType.routing_team,
      });

      // Send auto-reply
      await supabase.functions.invoke("send-auto-reply", {
        body: {
          emailId,
          replyTemplate: matchedType.auto_reply_template,
          recipient: email.sender,
        },
      });

      // Create task
      await supabase.from("tasks").insert({
        user_id: email.user_id,
        email_id: emailId,
        title: `${matchedType.name}: ${email.subject}`,
        description: classification.summary,
        priority: classification.urgencyLevel === "critical" || classification.urgencyLevel === "high" 
          ? "high" 
          : classification.urgencyLevel === "low" ? "low" : "medium",
        status: "pending",
      });
    }

    return new Response(
      JSON.stringify({ success: true, classification: emailClassification }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in classify-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
