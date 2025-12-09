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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // This contains the user_id
    const error = url.searchParams.get("error");

    console.log("Google OAuth callback received:", { code: !!code, state, error });

    if (error) {
      console.error("Google OAuth error:", error);
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Authentication Failed</title></head>
          <body>
            <script>
              window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
            <p>Authentication failed: ${error}. This window will close automatically.</p>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code || !state) {
      console.error("Missing code or state");
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Authentication Failed</title></head>
          <body>
            <script>
              window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Missing authorization code or state' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
            <p>Missing authorization code or state. This window will close automatically.</p>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google credentials");
      throw new Error("Google credentials not configured");
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;

    // Exchange authorization code for tokens
    console.log("Exchanging code for tokens...");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("Token exchange successful");

    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store tokens in database
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user settings exist
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", state)
      .single();

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from("user_settings")
        .update({
          google_access_token: access_token,
          google_refresh_token: refresh_token || null,
          google_token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", state);

      if (updateError) {
        console.error("Failed to update user settings:", updateError);
        throw updateError;
      }
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from("user_settings")
        .insert({
          user_id: state,
          google_access_token: access_token,
          google_refresh_token: refresh_token || null,
          google_token_expires_at: expiresAt,
        });

      if (insertError) {
        console.error("Failed to insert user settings:", insertError);
        throw insertError;
      }
    }

    console.log("Tokens stored successfully for user:", state);

    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body>
          <script>
            window.opener?.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            setTimeout(() => window.close(), 1500);
          </script>
          <p>Authentication successful! This window will close automatically.</p>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Google OAuth callback error:", error);
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>Authentication Failed</title></head>
        <body>
          <script>
            window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${errorMessage}' }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
          <p>Authentication failed: ${errorMessage}. This window will close automatically.</p>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
});
