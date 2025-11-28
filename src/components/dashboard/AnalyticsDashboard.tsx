import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Mail, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
    refetchInterval: 60000,
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    gradient, 
    trend 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    gradient: string;
    trend?: "up" | "down";
  }) => (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className={`h-1 ${gradient}`} />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <span className={`flex items-center text-xs font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
                  {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  12%
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-xl ${gradient} bg-opacity-10`}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl gradient-primary">
            <BarChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
            <p className="text-sm text-muted-foreground">Real-time automation metrics</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Live
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Emails Today" 
          value={liveStats?.totalEmails || 0} 
          icon={Mail} 
          gradient="gradient-primary"
          trend="up"
        />
        <StatCard 
          title="Auto-Classified" 
          value={liveStats?.classified || 0} 
          icon={CheckCircle} 
          gradient="gradient-success"
          trend="up"
        />
        <StatCard 
          title="Auto-Replied" 
          value={liveStats?.replied || 0} 
          icon={Zap} 
          gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
        />
        <StatCard 
          title="Escalations" 
          value={liveStats?.escalations || 0} 
          icon={AlertTriangle} 
          gradient="gradient-warning"
        />
      </div>

      {/* Performance Metrics */}
      {latestMetrics && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </div>
              <CardDescription>{format(new Date(latestMetrics.metric_date), "PPPP")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {latestMetrics.avg_response_time_minutes?.toFixed(0) || 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1">min</span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">SLA Breaches</p>
                <p className={`text-2xl font-bold ${(latestMetrics.sla_breaches || 0) > 0 ? "text-destructive" : "text-success"}`}>
                  {latestMetrics.sla_breaches || 0}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Classification Rate</p>
                <p className="text-2xl font-bold">
                  {latestMetrics.total_emails > 0
                    ? Math.round(((latestMetrics.auto_classified || 0) / (latestMetrics.total_emails || 1)) * 100)
                    : 0}
                  <span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Auto-Reply Rate</p>
                <p className="text-2xl font-bold">
                  {latestMetrics.total_emails > 0
                    ? Math.round(((latestMetrics.auto_replied || 0) / (latestMetrics.total_emails || 1)) * 100)
                    : 0}
                  <span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Types Breakdown */}
        {latestMetrics?.request_types_breakdown && Object.keys(latestMetrics.request_types_breakdown as Record<string, number>).length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Request Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(latestMetrics.request_types_breakdown as Record<string, number>).map(
                  ([type, count]) => {
                    const percentage = ((count as number) / (latestMetrics.total_emails || 1)) * 100;
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{type}</span>
                          <span className="text-muted-foreground">{count as number} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Performance */}
        {liveStats?.teamCounts && Object.keys(liveStats.teamCounts).length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Pending by Team
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {Object.entries(liveStats.teamCounts).map(([team, count]) => (
                  <div key={team} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      <span className="font-medium">{team}</span>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {(!latestMetrics || (liveStats?.totalEmails === 0)) && (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No data yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect your Microsoft account and run the automation to start seeing analytics data here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
