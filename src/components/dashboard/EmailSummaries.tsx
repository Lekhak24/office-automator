import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, Calendar, User, Plus, Loader2, Sparkles, CheckCircle2, 
  ExternalLink, Send, FileText, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EmailSummariesProps {
  userId: string;
}

const EmailSummaries = ({ userId }: EmailSummariesProps) => {
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emails, isLoading } = useQuery({
    queryKey: ["emails", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", userId)
        .order("received_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const processEmailMutation = useMutation({
    mutationFn: async (emailData: { sender: string; subject: string; body: string }) => {
      // First, add the email to the database
      const { data: email, error: insertError } = await supabase
        .from("emails")
        .insert({
          user_id: userId,
          email_id: `manual-${Date.now()}`,
          sender: emailData.sender,
          subject: emailData.subject,
          body: emailData.body,
          received_at: new Date().toISOString(),
          is_processed: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call the AI processing function
      const { data: result, error: processError } = await supabase.functions.invoke(
        "process-email",
        {
          body: { emailId: email.id, userId },
        }
      );

      if (processError) throw processError;
      return { email, result };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emails", userId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
      setIsAddingEmail(false);
      setSender("");
      setSubject("");
      setBody("");
      
      toast({
        title: "Email Processed Successfully!",
        description: `Classification: ${data.result?.classification?.requestType || "General"}. ${data.result?.taskCreated ? "Task created." : ""} ${data.result?.autoReplyGenerated ? "Auto-reply drafted." : ""}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddEmail = async () => {
    if (!sender || !subject || !body) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    await processEmailMutation.mutateAsync({ sender, subject, body });
    setIsProcessing(false);
  };

  const openOutlook = () => window.open("https://outlook.office.com/mail/", "_blank");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={openOutlook} variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          Open Outlook
          <ExternalLink className="h-3 w-3" />
        </Button>
        
        <Dialog open={isAddingEmail} onOpenChange={setIsAddingEmail}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Email for Processing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Process New Email with AI
              </DialogTitle>
              <DialogDescription>
                Paste an email from Outlook. AI will automatically classify it, create tasks, and generate auto-replies.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sender">Sender Email</Label>
                  <Input
                    id="sender"
                    placeholder="john.doe@company.com"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject line"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  placeholder="Paste the full email content here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">AI will automatically:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Classify request type
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Detect urgency level
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Create tasks if needed
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Generate auto-reply draft
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Route to correct team
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Summarize content
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleAddEmail} 
                disabled={isProcessing || !sender || !subject || !body}
                className="w-full gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Process Email
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Email List */}
      {!emails || emails.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">No Emails Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Click "Add Email for Processing" to paste emails from Outlook. 
                AI will automatically classify, create tasks, and generate responses.
              </p>
            </div>
            <Button onClick={() => setIsAddingEmail(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Email
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <Card key={email.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/30">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{email.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {email.sender}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(email.received_at), "PPp")}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {email.is_processed && (
                      <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    )}
                    {email.has_task && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <FileText className="h-3 w-3 mr-1" />
                        Task Created
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {email.summary && (
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">AI Summary: </span>
                      {email.summary}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailSummaries;