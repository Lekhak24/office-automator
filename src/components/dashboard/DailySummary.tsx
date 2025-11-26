import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Mail, CheckSquare, Calendar } from "lucide-react";
import { format } from "date-fns";

interface DailySummaryProps {
  userId: string;
}

const DailySummary = ({ userId }: DailySummaryProps) => {
  const { data: summaries, isLoading } = useQuery({
    queryKey: ["daily-summaries", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("user_id", userId)
        .order("summary_date", { ascending: false })
        .limit(7);

      if (error) throw error;
      return data;
    },
  });

  const { data: todayStats } = useQuery({
    queryKey: ["today-stats", userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [emails, tasks, meetings] = await Promise.all([
        supabase.from("emails").select("id", { count: "exact" }).eq("user_id", userId).gte("created_at", today),
        supabase.from("tasks").select("id, status", { count: "exact" }).eq("user_id", userId),
        supabase.from("meetings").select("id", { count: "exact" }).eq("user_id", userId).gte("start_time", today),
      ]);

      const pendingTasks = tasks.data?.filter(t => t.status !== "completed").length || 0;
      const completedTasks = tasks.data?.filter(t => t.status === "completed").length || 0;

      return {
        emailsProcessed: emails.count || 0,
        pendingTasks,
        completedTasks,
        meetingsToday: meetings.count || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Today's Summary
          </CardTitle>
          <CardDescription>{format(new Date(), "PPPP")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{todayStats?.emailsProcessed || 0}</p>
              <p className="text-sm text-muted-foreground">Emails Processed</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{todayStats?.pendingTasks || 0}</p>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{todayStats?.completedTasks || 0}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{todayStats?.meetingsToday || 0}</p>
              <p className="text-sm text-muted-foreground">Meetings Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {summaries && summaries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Summaries</h3>
          <div className="space-y-3">
            {summaries.map((summary) => (
              <Card key={summary.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {format(new Date(summary.summary_date), "PPPP")}
                  </CardTitle>
                  <CardDescription className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <span>{summary.emails_processed} emails</span>
                    <span>{summary.pending_tasks_count} pending</span>
                    <span>{summary.completed_tasks_count} completed</span>
                    <span>{summary.meetings_attended} meetings</span>
                  </CardDescription>
                </CardHeader>
                {summary.summary_text && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{summary.summary_text}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySummary;
