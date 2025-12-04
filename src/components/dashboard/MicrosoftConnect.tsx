import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ClipboardCopy, ArrowRight } from "lucide-react";

interface MicrosoftConnectProps {
  userId: string;
  userEmail?: string;
}

const MicrosoftConnect = ({ userId, userEmail }: MicrosoftConnectProps) => {
  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">How to Process Emails</CardTitle>
            <CardDescription>Simple 3-step workflow</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Open Outlook in your browser</p>
              <p className="text-sm text-muted-foreground">Go to outlook.office.com separately (not through this app)</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
              2
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="font-medium">Copy email details</p>
                <p className="text-sm text-muted-foreground">Copy: Subject, From address, and Body text</p>
              </div>
              <ClipboardCopy className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
              3
            </div>
            <div className="flex items-start gap-2">
              <div>
                <p className="font-medium">Paste in Email Summaries tab</p>
                <p className="text-sm text-muted-foreground">The AI will auto-classify, create tasks & generate replies</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4 p-2 bg-amber-500/10 rounded border border-amber-500/20">
            Due to company security policies, direct Outlook integration is not available. Use the manual workflow above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MicrosoftConnect;
