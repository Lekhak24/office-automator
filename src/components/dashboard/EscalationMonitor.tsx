import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const EscalationMonitor = () => {
  const { data: escalations, isLoading } = useQuery({
    queryKey: ["escalations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escalations")
        .select(`
          *,
          emails!inner(subject, sender),
          team_assignments(team_name)
        `)
        .order("escalated_at", { ascending: false });

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

  if (!escalations || escalations.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-muted-foreground">No escalations - System running smoothly! ✓</p>
        </CardContent>
      </Card>
    );
  }

  const activeEscalations = escalations.filter((e) => !e.resolved);
  const resolvedEscalations = escalations.filter((e) => e.resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-6 w-6 text-orange-500" />
        <h2 className="text-2xl font-bold">Escalation Monitor</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Escalations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{escalations.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{activeEscalations.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/50">
          <CardHeader className="pb-3">
            <CardDescription>Resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{resolvedEscalations.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Escalations */}
      {activeEscalations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-orange-500">
            ⚠️ Active Escalations Requiring Attention
          </h3>
          <div className="space-y-3">
            {activeEscalations.map((escalation: any) => {
              const escalatedAt = new Date(escalation.escalated_at);
              const hoursElapsed = Math.floor((Date.now() - escalatedAt.getTime()) / (1000 * 60 * 60));

              return (
                <Card key={escalation.id} className="border-orange-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          {escalation.emails.subject}
                        </CardTitle>
                        <CardDescription>
                          From: {escalation.emails.sender} •{" "}
                          {escalation.team_assignments?.[0]?.team_name || "Unknown Team"}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">
                        {hoursElapsed}h since escalation
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Escalated to:</span>
                        <Badge variant="outline">{escalation.escalated_to}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {escalation.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Escalated at: {format(escalatedAt, "PPp")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved Escalations */}
      {resolvedEscalations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-500">
            ✓ Resolved Escalations
          </h3>
          <div className="space-y-3">
            {resolvedEscalations.slice(0, 10).map((escalation: any) => (
              <Card key={escalation.id} className="opacity-60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{escalation.emails.subject}</CardTitle>
                  <CardDescription className="text-xs">
                    Resolved at: {format(new Date(escalation.resolved_at), "PPp")}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationMonitor;
