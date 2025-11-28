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
    const state = url.searchParams.get("state"); // Contains user_id
    const error = url.searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'oauth-error',error:'${error}'},'*');window.close();</script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code || !state) {
      throw new Error("Missing code or state parameter");
    }

    const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
    const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    const tenantId = Deno.env.get("MICROSOFT_TENANT_ID") || "common";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!clientId || !clientSecret) {
      throw new Error("Microsoft credentials not configured");
    }

    // Exchange code for tokens
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const redirectUri = `${supabaseUrl}/functions/v1/microsoft-oauth-callback`;

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read offline_access",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange error:", errorText);
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();
    console.log("Successfully obtained tokens");

    // Store tokens in database
    const supabase = createClient(supabaseUrl, supabaseKey);
    const userId = state;

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        microsoft_access_token: tokens.access_token,
        microsoft_refresh_token: tokens.refresh_token,
        microsoft_token_expires_at: expiresAt,
        email_sync_enabled: true,
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Error storing tokens:", upsertError);
      throw new Error("Failed to store tokens");
    }

    console.log(`Successfully stored Microsoft tokens for user: ${userId}`);

    // Return success page that closes the popup
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Connected Successfully</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255,255,255,0.1);
              border-radius: 16px;
              backdrop-filter: blur(10px);
            }
            .checkmark {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 { margin: 0 0 10px 0; }
            p { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✓</div>
            <h1>Connected Successfully!</h1>
            <p>Your Microsoft account is now connected.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            window.opener?.postMessage({ type: 'oauth-success' }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255,255,255,0.1);
              border-radius: 16px;
              backdrop-filter: blur(10px);
            }
            .error-icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">✕</div>
            <h1>Connection Failed</h1>
            <p>${error.message}</p>
          </div>
          <script>
            window.opener?.postMessage({ type: 'oauth-error', error: '${error.message}' }, '*');
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
});
