import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Mail, CheckSquare, Calendar, FileText, Settings, BarChart, GitBranch, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailSummaries from "@/components/dashboard/EmailSummaries";
import TaskManager from "@/components/dashboard/TaskManager";
import MeetingScheduler from "@/components/dashboard/MeetingScheduler";
import DailySummary from "@/components/dashboard/DailySummary";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import RequestRouter from "@/components/dashboard/RequestRouter";
import EscalationMonitor from "@/components/dashboard/EscalationMonitor";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Office AI Assistant</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-8">
            <TabsTrigger value="analytics">
              <BarChart className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="routing">
              <GitBranch className="mr-2 h-4 w-4" />
              Routing
            </TabsTrigger>
            <TabsTrigger value="escalations">
              <AlertCircle className="mr-2 h-4 w-4" />
              Escalations
            </TabsTrigger>
            <TabsTrigger value="emails">
              <Mail className="mr-2 h-4 w-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="mr-2 h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="meetings">
              <Calendar className="mr-2 h-4 w-4" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="summary">
              <FileText className="mr-2 h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard userId={user?.id} />
          </TabsContent>

          <TabsContent value="routing" className="space-y-4">
            <RequestRouter />
          </TabsContent>

          <TabsContent value="escalations" className="space-y-4">
            <EscalationMonitor />
          </TabsContent>

          <TabsContent value="emails" className="space-y-4">
            <EmailSummaries userId={user?.id} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TaskManager userId={user?.id} />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <MeetingScheduler userId={user?.id} />
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <DailySummary userId={user?.id} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SettingsPanel userId={user?.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
