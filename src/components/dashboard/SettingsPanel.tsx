import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Calendar, Settings2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsPanelProps {
  userId: string;
}

const SettingsPanel = ({ userId }: SettingsPanelProps) => {
  const [emailSyncEnabled, setEmailSyncEnabled] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const { toast } = useToast();

  const handleConnectOutlook = () => {
    toast({
      title: "Coming Soon",
      description: "Microsoft Outlook integration will be available soon. You'll be able to connect your account to automatically sync emails, calendar, and Teams.",
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Microsoft Integration Setup:</strong> To enable full automation, you'll need to connect your Microsoft account. This will allow the AI to access your Outlook emails, Teams messages, and calendar automatically.
        </AlertDescription>
      </Alert>

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
