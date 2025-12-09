import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MicrosoftConnectProps {
  userId: string;
  userEmail?: string;
}

const MicrosoftConnect = ({ userId, userEmail }: MicrosoftConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
    
    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth-success') {
        setIsConnected(true);
        toast({
          title: "Connected!",
          description: "Your Microsoft account is now connected.",
        });
      } else if (event.data?.type === 'oauth-error') {
        toast({
          title: "Connection failed",
          description: event.data.error || "Failed to connect Microsoft account",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkConnectionStatus = async () => {
    const { data, error } = await supabase
      .from("user_settings")
      .select("microsoft_access_token, email_sync_enabled")
      .eq("user_id", userId)
      .single();

    if (data?.microsoft_access_token && data?.email_sync_enabled) {
      setIsConnected(true);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    
    const clientId = "c6ed5892-751b-49ee-9f37-f6cf90319d44";
    const tenantId = "330a8b8c-66ba-485c-bddd-3beeb7f55fe8";
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/microsoft-oauth-callback`;
    const scope = "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read offline_access";
    
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${userId}` +
      `&response_mode=query`;

    // Open OAuth popup
    const popup = window.open(authUrl, 'Microsoft OAuth', 'width=600,height=700');
    
    // Check if popup was blocked
    if (!popup) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to connect your Microsoft account",
        variant: "destructive",
      });
      setIsConnecting(false);
      return;
    }

    // Monitor popup close
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsConnecting(false);
        checkConnectionStatus();
      }
    }, 500);
  };

  const handleFetchEmails = async () => {
    setIsFetching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-emails`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch emails");
      }

      toast({
        title: "Emails synced!",
        description: `Fetched ${result.fetched} emails, stored ${result.stored} new ones.`,
      });
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Microsoft Outlook</CardTitle>
            <CardDescription>
              {isConnected ? "Connected - sync your emails" : "Connect to fetch emails automatically"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Microsoft account connected</span>
              </div>
              <Button 
                onClick={handleFetchEmails} 
                disabled={isFetching}
                className="w-full"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing emails...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Emails Now
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Click to fetch new emails from your Outlook inbox
              </p>
            </>
          ) : (
            <>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Connect Microsoft Account
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Grant permission to read and sync your Outlook emails
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MicrosoftConnect;
