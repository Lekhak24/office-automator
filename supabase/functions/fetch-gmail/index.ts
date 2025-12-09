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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("Unauthorized");
    }

    console.log("Fetching emails for user:", user.id);

    // Get user's Google tokens
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("google_access_token, google_refresh_token, google_token_expires_at")
      .eq("user_id", user.id)
      .single();

    if (settingsError || !settings?.google_access_token) {
      console.error("Settings error:", settingsError);
      throw new Error("Google not connected. Please connect your Google account first.");
    }

    let accessToken = settings.google_access_token;

    // Check if token is expired and refresh if needed
    if (settings.google_token_expires_at) {
      const expiresAt = new Date(settings.google_token_expires_at);
      if (expiresAt <= new Date() && settings.google_refresh_token) {
        console.log("Token expired, refreshing...");
        
        const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
        const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID!,
            client_secret: GOOGLE_CLIENT_SECRET!,
            refresh_token: settings.google_refresh_token,
            grant_type: "refresh_token",
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          accessToken = refreshData.access_token;
          
          // Update stored token
          await supabase
            .from("user_settings")
            .update({
              google_access_token: accessToken,
              google_token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
            })
            .eq("user_id", user.id);
        } else {
          throw new Error("Failed to refresh Google token. Please reconnect your account.");
        }
      }
    }

    // Fetch emails from Gmail API
    console.log("Fetching messages from Gmail...");
    const messagesResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error("Gmail API error:", errorText);
      throw new Error("Failed to fetch emails from Gmail");
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.messages || [];

    console.log(`Found ${messages.length} messages`);

    const storedEmails = [];

    // Fetch full details for each message
    for (const message of messages) {
      try {
        // Check if email already exists
        const { data: existingEmail } = await supabase
          .from("emails")
          .select("id")
          .eq("email_id", message.id)
          .eq("user_id", user.id)
          .single();

        if (existingEmail) {
          console.log("Email already exists:", message.id);
          continue;
        }

        // Fetch full message details
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!detailResponse.ok) continue;

        const emailData = await detailResponse.json();
        const headers = emailData.payload?.headers || [];

        const getHeader = (name: string) => 
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const subject = getHeader("Subject") || "(No Subject)";
        const from = getHeader("From") || "Unknown";
        const dateStr = getHeader("Date");
        const receivedAt = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();

        // Extract body
        let body = "";
        if (emailData.payload?.body?.data) {
          body = atob(emailData.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        } else if (emailData.payload?.parts) {
          const textPart = emailData.payload.parts.find(
            (p: any) => p.mimeType === "text/plain"
          );
          if (textPart?.body?.data) {
            body = atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          }
        }

        // Store email
        const { data: insertedEmail, error: insertError } = await supabase
          .from("emails")
          .insert({
            email_id: message.id,
            user_id: user.id,
            subject,
            sender: from,
            body: body.substring(0, 10000), // Limit body size
            received_at: receivedAt,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting email:", insertError);
        } else {
          storedEmails.push(insertedEmail);
          console.log("Stored email:", subject);
        }
      } catch (emailError) {
        console.error("Error processing email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fetched: messages.length,
        stored: storedEmails.length,
        emails: storedEmails,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Fetch Gmail error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
