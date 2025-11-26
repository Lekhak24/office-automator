import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface EmailSummariesProps {
  userId: string;
}

const EmailSummaries = ({ userId }: EmailSummariesProps) => {
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

  if (!emails || emails.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No emails yet. Connect your Outlook account in Settings to start.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <Card key={email.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg">{email.subject}</CardTitle>
                <CardDescription className="flex items-center gap-4">
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
              {email.has_task && (
                <Badge variant="secondary" className="ml-2">
                  Task Detected
                </Badge>
              )}
            </div>
          </CardHeader>
          {email.summary && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{email.summary}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default EmailSummaries;
