import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, Users, ExternalLink } from "lucide-react";

interface MicrosoftConnectProps {
  userId: string;
  userEmail?: string;
}

const MicrosoftConnect = ({ userId, userEmail }: MicrosoftConnectProps) => {
  const openOutlook = () => {
    window.open("https://outlook.office.com/mail/", "_blank");
  };

  const openTeams = () => {
    window.open("https://teams.microsoft.com/", "_blank");
  };

  const openCalendar = () => {
    window.open("https://outlook.office.com/calendar/", "_blank");
  };

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#0078d4]/10 to-[#00a4ef]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0078d4] flex items-center justify-center">
            <svg viewBox="0 0 23 23" className="w-6 h-6 fill-white">
              <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg">Microsoft 365 Quick Access</CardTitle>
            <CardDescription>Open Outlook, Teams & Calendar instantly</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Access your Microsoft 365 apps directly. Your login session will be used automatically.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={openOutlook}
              className="flex flex-col items-center gap-2 h-auto py-4 bg-[#0078d4] hover:bg-[#106ebe] text-white"
            >
              <Mail className="h-6 w-6" />
              <span className="text-sm font-medium">Open Outlook</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
            
            <Button
              onClick={openTeams}
              className="flex flex-col items-center gap-2 h-auto py-4 bg-[#6264a7] hover:bg-[#5558a0] text-white"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">Open Teams</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
            
            <Button
              onClick={openCalendar}
              className="flex flex-col items-center gap-2 h-auto py-4 bg-[#0078d4] hover:bg-[#106ebe] text-white"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm font-medium">Open Calendar</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            These links open the web versions of Microsoft 365 apps. Sign in with your work account.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MicrosoftConnect;