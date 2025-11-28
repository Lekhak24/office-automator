import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Play, RefreshCw, Settings2, Clock, Zap, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import MicrosoftConnect from "./MicrosoftConnect";

interface SettingsPanelProps {
  userId: string;
}

const SettingsPanel = ({ userId }: SettingsPanelProps) => {
  const [emailSyncEnabled, setEmailSyncEnabled] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runAutomation = useMutation({
    mutationFn: async (action: string) => {
      const authHeader = (await supabase.auth.getSession()).data.session?.access_token;
      
      if (action === "fetch-emails") {
        const { data, error } = await supabase.functions.invoke("fetch-emails", {
          headers: { Authorization: `Bearer ${authHeader}` },
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

  const handleRunAutomation = async () => {
    setIsProcessing(true);
    try {
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
      {/* Status Banner */}
      <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <Zap className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>AI Office Automation</strong> — Zero manual work. All processing is done automatically by AI.
          </span>
          <Badge variant="outline" className="ml-2 border-success text-success">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Microsoft Connection */}
        <MicrosoftConnect userId={userId} />

        {/* Automation Control */}
        <Card className="border-2 border-primary/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Automation Control
            </CardTitle>
            <CardDescription>
              Run the full automation pipeline manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Button 
              onClick={handleRunAutomation} 
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90 transition-opacity"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Run Full Automation
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Fetch → Classify → Route → Reply → Escalate → Analytics
            </p>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runAutomation.mutate("fetch-emails")}
                disabled={runAutomation.isPending}
                className="text-xs"
              >
                Fetch Emails
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runAutomation.mutate("check-escalations")}
                disabled={runAutomation.isPending}
                className="text-xs"
              >
                Escalations
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runAutomation.mutate("generate-analytics")}
                disabled={runAutomation.isPending}
                className="text-xs"
              >
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Automated Schedules
            </CardTitle>
            <CardDescription>
              Cron jobs running in the background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Email Sync</p>
                  <p className="text-xs text-muted-foreground">Every 5 minutes</p>
                </div>
                <Badge variant="outline" className="border-success text-success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Escalation Check</p>
                  <p className="text-xs text-muted-foreground">Every hour</p>
                </div>
                <Badge variant="outline" className="border-success text-success">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Daily Analytics</p>
                  <p className="text-xs text-muted-foreground">Every day at midnight</p>
                </div>
                <Badge variant="outline" className="border-success text-success">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription>
              Configure automation behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Email Sync</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically fetch new emails
                </p>
              </div>
              <Switch
                checked={emailSyncEnabled}
                onCheckedChange={setEmailSyncEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Reply</Label>
                <p className="text-xs text-muted-foreground">
                  Send automatic acknowledgements
                </p>
              </div>
              <Switch
                checked={autoReplyEnabled}
                onCheckedChange={setAutoReplyEnabled}
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="summary-time">Daily Summary Time</Label>
              <Input
                id="summary-time"
                type="time"
                defaultValue="18:00"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Receive daily summary at this time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPanel;
