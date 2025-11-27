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

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get user from JWT
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      throw new Error("Invalid user");
    }

    console.log(`Fetching emails for user: ${user.id}`);

    // Get user's Microsoft tokens
    const { data: settings } = await supabase
      .from("user_settings")
      .select("microsoft_access_token, microsoft_refresh_token, microsoft_token_expires_at")
      .eq("user_id", user.id)
      .single();

    if (!settings?.microsoft_access_token) {
      return new Response(
        JSON.stringify({ error: "Microsoft account not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token needs refresh
    let accessToken = settings.microsoft_access_token;
    if (settings.microsoft_token_expires_at && new Date(settings.microsoft_token_expires_at) < new Date()) {
      console.log("Token expired, refreshing...");
      // Refresh token logic would go here
      // For now, just use existing token
    }

    // Fetch emails from Microsoft Graph API
    const graphResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me/messages?$top=20&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,body",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text();
      console.error("Microsoft Graph API error:", errorText);
      throw new Error(`Microsoft Graph API error: ${graphResponse.status}`);
    }

    const graphData = await graphResponse.json();
    console.log(`Fetched ${graphData.value?.length || 0} emails from Microsoft`);

    // Process and store emails
    const emails = graphData.value || [];
    const storedEmails = [];

    for (const email of emails) {
      // Check if email already exists
      const { data: existing } = await supabase
        .from("emails")
        .select("id")
        .eq("email_id", email.id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        console.log(`Email ${email.id} already exists, skipping`);
        continue;
      }

      // Insert new email
      const { data: newEmail, error: insertError } = await supabase
        .from("emails")
        .insert({
          user_id: user.id,
          email_id: email.id,
          subject: email.subject || "(No Subject)",
          sender: email.from?.emailAddress?.address || "unknown",
          received_at: email.receivedDateTime,
          body: email.body?.content || "",
          is_processed: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting email:", insertError);
        continue;
      }

      storedEmails.push(newEmail);
      console.log(`Stored email: ${newEmail.subject}`);

      // Trigger classification for new email
      try {
        await supabase.functions.invoke("classify-email", {
          body: { emailId: newEmail.id },
        });
      } catch (classifyError) {
        console.error("Error triggering classification:", classifyError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fetched: emails.length,
        stored: storedEmails.length,
        emails: storedEmails,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in fetch-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
