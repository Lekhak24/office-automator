import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Calendar, Settings2, AlertCircle, Play, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SettingsPanelProps {
  userId: string;
}

const SettingsPanel = ({ userId }: SettingsPanelProps) => {
  const [emailSyncEnabled, setEmailSyncEnabled] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runAutomation = useMutation({
    mutationFn: async (action: string) => {
      const authHeader = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (action === "fetch-emails") {
        const { data, error } = await supabase.functions.invoke("fetch-emails", {
          headers: {
            Authorization: `Bearer ${authHeader}`,
          },
        });
        if (error) throw error;
        return data;
      } else if (action === "check-escalations") {
        const { data, error } = await supabase.functions.invoke("check-escalations");
        if (error) throw error;
        return data;
      } else if (action === "generate-analytics") {
        const { data, error } = await supabase.functions.invoke("generate-analytics");
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries();
      toast({
        title: "Success",
        description: action === "fetch-emails" 
          ? `Fetched ${data?.stored || 0} new emails and processed them automatically!`
          : action === "check-escalations"
          ? `Checked for escalations. ${data?.escalated || 0} items escalated.`
          : "Analytics generated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleConnectOutlook = () => {
    toast({
      title: "Microsoft Integration",
      description: "Microsoft Outlook OAuth integration is being configured. You'll be able to connect your account soon.",
    });
  };

  const handleRunAutomation = async () => {
    setIsProcessing(true);
    try {
      // Run all automation steps in sequence
      await runAutomation.mutateAsync("fetch-emails");
      await runAutomation.mutateAsync("check-escalations");
      await runAutomation.mutateAsync("generate-analytics");
      
      toast({
        title: "Full Automation Complete! ✓",
        description: "Emails fetched, classified, routed, replied, escalations checked, and analytics generated.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>AI Office Automation System:</strong> This system automatically fetches, classifies, routes, and responds to emails with zero manual work. All processing is done by AI.
        </AlertDescription>
      </Alert>

      {/* Automation Control */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Automation Control
          </CardTitle>
          <CardDescription>
            Run the full automation pipeline manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleRunAutomation} 
            className="w-full" 
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Full Automation Now
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            This will: Fetch emails → Classify → Route to teams → Send auto-replies → Check escalations → Generate analytics
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => runAutomation.mutate("fetch-emails")}
              disabled={runAutomation.isPending}
            >
              <Mail className="mr-2 h-4 w-4" />
              Fetch Emails
            </Button>
            <Button 
              variant="outline" 
              onClick={() => runAutomation.mutate("check-escalations")}
              disabled={runAutomation.isPending}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Check Escalations
            </Button>
            <Button 
              variant="outline" 
              onClick={() => runAutomation.mutate("generate-analytics")}
              disabled={runAutomation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Integration
          </CardTitle>
          <CardDescription>
            Connect your Outlook account to enable automated email processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleConnectOutlook} className="w-full">
            Connect Microsoft Outlook
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Email Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically fetch and process new emails
              </p>
            </div>
            <Switch
              checked={emailSyncEnabled}
              onCheckedChange={setEmailSyncEnabled}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Reply</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send replies for task assignments
              </p>
            </div>
            <Switch
              checked={autoReplyEnabled}
              onCheckedChange={setAutoReplyEnabled}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your calendar for automatic meeting scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleConnectOutlook} variant="outline" className="w-full">
            Connect Microsoft Calendar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Automation Settings
          </CardTitle>
          <CardDescription>
            Configure your automation preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary-time">Daily Summary Time</Label>
            <Input
              id="summary-time"
              type="time"
              defaultValue="18:00"
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Receive a daily summary of pending tasks and work
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
