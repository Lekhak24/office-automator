import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Mail, Calendar, Users } from "lucide-react";

interface MicrosoftConnectProps {
  userId: string;
}

const MicrosoftConnect = ({ userId }: MicrosoftConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();

    // Listen for OAuth popup messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "oauth-success") {
        setIsConnected(true);
        setIsConnecting(false);
        checkConnectionStatus();
        toast({
          title: "Connected Successfully!",
          description: "Your Microsoft account is now connected.",
        });
      } else if (event.data.type === "oauth-error") {
        setIsConnecting(false);
        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect Microsoft account.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userId]);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("microsoft_access_token, microsoft_token_expires_at")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking connection:", error);
      }

      if (data?.microsoft_access_token) {
        setIsConnected(true);
        setTokenExpiresAt(data.microsoft_token_expires_at);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);

    const clientId = "YOUR_MICROSOFT_CLIENT_ID"; // This will be replaced with actual value
    const tenantId = "common";
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft-oauth-callback`;
    const scope = encodeURIComponent(
      "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read offline_access"
    );

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${userId}&response_mode=query`;

    // Open OAuth popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      "Microsoft OAuth",
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    // Check if popup was blocked
    if (!popup) {
      setIsConnecting(false);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to connect your Microsoft account.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({
          microsoft_access_token: null,
          microsoft_refresh_token: null,
          microsoft_token_expires_at: null,
          email_sync_enabled: false,
        })
        .eq("user_id", userId);

      if (error) throw error;

      setIsConnected(false);
      setTokenExpiresAt(null);
      toast({
        title: "Disconnected",
        description: "Your Microsoft account has been disconnected.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isTokenExpired = tokenExpiresAt && new Date(tokenExpiresAt) < new Date();

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#0078d4]/10 to-[#00a4ef]/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0078d4] flex items-center justify-center">
              <svg viewBox="0 0 23 23" className="w-6 h-6 fill-white">
                <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg">Microsoft 365</CardTitle>
              <CardDescription>Outlook, Teams & Calendar</CardDescription>
            </div>
          </div>
          {!isLoading && (
            <Badge variant={isConnected && !isTokenExpired ? "default" : "secondary"} className="text-sm">
              {isConnected && !isTokenExpired ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
              ) : isTokenExpired ? (
                <><XCircle className="w-3 h-3 mr-1" /> Expired</>
              ) : (
                "Not Connected"
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isConnected && !isTokenExpired ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Outlook</span>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Calendar</span>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Teams</span>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>
            </div>
            {tokenExpiresAt && (
              <p className="text-xs text-muted-foreground text-center">
                Token expires: {new Date(tokenExpiresAt).toLocaleString()}
              </p>
            )}
            <Button variant="outline" onClick={handleDisconnect} className="w-full">
              Disconnect Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Connect your Microsoft 365 account to enable automatic email fetching, calendar sync, and Teams integration.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>Email Sync</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Teams</span>
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-[#0078d4] hover:bg-[#106ebe] text-white"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 23 23" className="w-4 h-4 mr-2 fill-current">
                    <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                  </svg>
                  Connect Microsoft 365
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MicrosoftConnect;
