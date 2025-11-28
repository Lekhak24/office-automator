import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, LogOut, Mail, CheckSquare, Calendar, FileText, Settings, 
  BarChart, GitBranch, AlertCircle, Sparkles, Zap
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailSummaries from "@/components/dashboard/EmailSummaries";
import TaskManager from "@/components/dashboard/TaskManager";
import MeetingScheduler from "@/components/dashboard/MeetingScheduler";
import DailySummary from "@/components/dashboard/DailySummary";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import RequestRouter from "@/components/dashboard/RequestRouter";
import EscalationMonitor from "@/components/dashboard/EscalationMonitor";
import BADocumentGenerator from "@/components/dashboard/BADocumentGenerator";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse-glow" />
            <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  AI Office Automation
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Pro
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full flex flex-wrap justify-start gap-1 bg-muted/50 p-1 rounded-xl mb-6 h-auto">
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:shadow-sm">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="routing" className="gap-2 data-[state=active]:shadow-sm">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Routing</span>
            </TabsTrigger>
            <TabsTrigger value="escalations" className="gap-2 data-[state=active]:shadow-sm">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Escalations</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2 data-[state=active]:shadow-sm">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2 data-[state=active]:shadow-sm">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2 data-[state=active]:shadow-sm">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Meetings</span>
            </TabsTrigger>
            <TabsTrigger value="ba-docs" className="gap-2 data-[state=active]:shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">BA Docs</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2 data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <div className="animate-fade-in">
            <TabsContent value="analytics" className="space-y-4 mt-0">
              <AnalyticsDashboard userId={user?.id} />
            </TabsContent>

            <TabsContent value="routing" className="space-y-4 mt-0">
              <RequestRouter />
            </TabsContent>

            <TabsContent value="escalations" className="space-y-4 mt-0">
              <EscalationMonitor />
            </TabsContent>

            <TabsContent value="emails" className="space-y-4 mt-0">
              <EmailSummaries userId={user?.id} />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 mt-0">
              <TaskManager userId={user?.id} />
            </TabsContent>

            <TabsContent value="meetings" className="space-y-4 mt-0">
              <MeetingScheduler userId={user?.id} />
            </TabsContent>

            <TabsContent value="ba-docs" className="space-y-4 mt-0">
              <BADocumentGenerator userId={user?.id} />
            </TabsContent>

            <TabsContent value="summary" className="space-y-4 mt-0">
              <DailySummary userId={user?.id} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-0">
              <SettingsPanel userId={user?.id} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
