import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, TrendingUp, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { format } from "date-fns";

interface AnalyticsDashboardProps {
  userId: string;
}

const AnalyticsDashboard = ({ userId }: AnalyticsDashboardProps) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_metrics")
        .select("*")
        .order("metric_date", { ascending: false })
        .limit(7);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: liveStats } = useQuery({
    queryKey: ["live-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const [
        { count: totalEmails },
        { count: classified },
        { count: replied },
        { count: escalations },
        { data: unresolvedAssignments },
      ] = await Promise.all([
        supabase.from("emails").select("*", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("email_classifications").select("*", { count: "exact", head: true }).gte("classified_at", today),
        supabase.from("auto_replies").select("*", { count: "exact", head: true }).gte("sent_at", today),
        supabase.from("escalations").select("*", { count: "exact", head: true }).gte("escalated_at", today),
        supabase.from("team_assignments").select("team_name").eq("resolved", false),
      ]);

      // Count unresolved by team
      const teamCounts: Record<string, number> = {};
      unresolvedAssignments?.forEach((assignment) => {
        teamCounts[assignment.team_name] = (teamCounts[assignment.team_name] || 0) + 1;
      });

      return {
        totalEmails: totalEmails || 0,
        classified: classified || 0,
        replied: replied || 0,
        escalations: escalations || 0,
        teamCounts,
      };
    },
    refetchInterval: 30000,
  });

  const latestMetrics = analytics?.[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardDescription>Total Emails Today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-primary">{liveStats?.totalEmails || 0}</p>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Auto-Classified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-green-500">{liveStats?.classified || 0}</p>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Auto-Replied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-blue-500">{liveStats?.replied || 0}</p>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Escalations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-orange-500">{liveStats?.escalations || 0}</p>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Metrics */}
      {latestMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Performance
            </CardTitle>
            <CardDescription>{format(new Date(latestMetrics.metric_date), "PPPP")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-xl font-bold">
                  {latestMetrics.avg_response_time_minutes?.toFixed(0) || 0} min
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">SLA Breaches</p>
                <p className="text-xl font-bold text-red-500">{latestMetrics.sla_breaches || 0}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Classification Rate</p>
                <p className="text-xl font-bold">
                  {latestMetrics.total_emails > 0
                    ? Math.round((latestMetrics.auto_classified / latestMetrics.total_emails) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Auto-Reply Rate</p>
                <p className="text-xl font-bold">
                  {latestMetrics.total_emails > 0
                    ? Math.round((latestMetrics.auto_replied / latestMetrics.total_emails) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Types Breakdown */}
      {latestMetrics?.request_types_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Request Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(latestMetrics.request_types_breakdown as Record<string, number>).map(
                ([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(count / latestMetrics.total_emails) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Performance */}
      {liveStats?.teamCounts && Object.keys(liveStats.teamCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unresolved Assignments by Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(liveStats.teamCounts).map(([team, count]) => (
                <div key={team} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{team}</span>
                  <span className="text-xl font-bold text-orange-500">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
