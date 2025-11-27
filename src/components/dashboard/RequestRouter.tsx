import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const RequestRouter = () => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["team-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_assignments")
        .select(`
          *,
          emails!inner(subject, sender, received_at),
          email_classifications(urgency_level, auto_reply_sent)
        `)
        .order("assigned_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No routing assignments yet</p>
        </CardContent>
      </Card>
    );
  }

  const unresolvedAssignments = assignments.filter((a) => !a.resolved);
  const resolvedAssignments = assignments.filter((a) => a.resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Request Routing</h2>
      </div>

      {/* Unresolved Assignments */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Active Assignments ({unresolvedAssignments.length})
        </h3>
        <div className="space-y-3">
          {unresolvedAssignments.map((assignment: any) => {
            const assignedAt = new Date(assignment.assigned_at);
            const hoursElapsed = Math.floor((Date.now() - assignedAt.getTime()) / (1000 * 60 * 60));
            const urgencyLevel = assignment.email_classifications?.[0]?.urgency_level || "medium";
            const autoReplySent = assignment.email_classifications?.[0]?.auto_reply_sent || false;

            return (
              <Card
                key={assignment.id}
                className={
                  urgencyLevel === "critical" || urgencyLevel === "high"
                    ? "border-red-500/50"
                    : hoursElapsed > 6
                    ? "border-orange-500/50"
                    : ""
                }
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{assignment.emails.subject}</CardTitle>
                      <CardDescription>From: {assignment.emails.sender}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          urgencyLevel === "critical"
                            ? "destructive"
                            : urgencyLevel === "high"
                            ? "destructive"
                            : urgencyLevel === "low"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {urgencyLevel}
                      </Badge>
                      {autoReplySent && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                          Auto-Replied
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-primary">{assignment.team_name}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {hoursElapsed}h ago
                      </span>
                    </div>
                    {assignment.acknowledged ? (
                      <Badge variant="secondary">Acknowledged</Badge>
                    ) : hoursElapsed > 2 ? (
                      <Badge variant="destructive">Needs Attention</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Resolved Assignments */}
      {resolvedAssignments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Recently Resolved ({resolvedAssignments.length})
          </h3>
          <div className="space-y-3">
            {resolvedAssignments.slice(0, 10).map((assignment: any) => (
              <Card key={assignment.id} className="opacity-70">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-sm">{assignment.emails.subject}</CardTitle>
                      <CardDescription className="text-xs">
                        {assignment.team_name} • Resolved {format(new Date(assignment.resolved_at), "PPp")}
                      </CardDescription>
                    </div>
                    {assignment.response_time_minutes && (
                      <Badge variant="secondary" className="text-xs">
                        {assignment.response_time_minutes}m
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestRouter;
