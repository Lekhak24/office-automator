import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Mail, GitBranch, Clock, BarChart, CheckCircle, 
  ArrowRight, Sparkles, Shield, Users, FileText, AlertTriangle
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Mail,
      title: "Smart Email Processing",
      description: "AI automatically reads, understands, and classifies incoming emails with semantic understanding."
    },
    {
      icon: GitBranch,
      title: "Intelligent Routing",
      description: "Requests are automatically routed to the right team based on content and urgency level."
    },
    {
      icon: Zap,
      title: "Auto-Reply System",
      description: "Professional acknowledgement emails sent instantly with expected response times."
    },
    {
      icon: Clock,
      title: "SLA Monitoring",
      description: "Real-time tracking of response times with automatic escalation for overdue items."
    },
    {
      icon: BarChart,
      title: "Live Analytics",
      description: "Comprehensive dashboards showing performance metrics and team productivity."
    },
    {
      icon: Sparkles,
      title: "BA Document Generator",
      description: "AI-powered creation of User Stories, BRDs, and FRDs from simple descriptions."
    },
  ];

  const stats = [
    { value: "100%", label: "Automated" },
    { value: "5min", label: "Email Sync" },
    { value: "1hr", label: "Escalation" },
    { value: "24/7", label: "Active" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AI Office Automation</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Automation
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="text-gradient">Zero Manual Work.</span>
            <br />
            Complete Office Automation.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your email workflow with AI that automatically reads, classifies, routes, 
            and responds to requests. No manual intervention required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary h-12 px-8 text-base">
                Start Automating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</p>
                <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything Automated</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From email arrival to task completion, every step is handled by intelligent automation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Simple input, powerful automation</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Email Arrives", icon: Mail, desc: "System automatically fetches emails from Outlook" },
                { step: "2", title: "AI Processes", icon: Sparkles, desc: "Classifies type, urgency, and routes to team" },
                { step: "3", title: "Action Taken", icon: CheckCircle, desc: "Auto-reply sent, task created, tracked" },
              ].map((item, idx) => (
                <div key={item.step} className="relative text-center">
                  <div className="w-16 h-16 rounded-full gradient-primary mx-auto flex items-center justify-center mb-4 shadow-glow">
                    <item.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="text-sm font-bold text-primary mb-1">Step {item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Request Types */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Request Types Handled</h2>
            <p className="text-muted-foreground">Intelligent classification for all request types</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Leave Request", team: "HR Team", sla: "8h" },
              { name: "Access Request", team: "IT Security", sla: "4h" },
              { name: "Project Update", team: "PM Team", sla: "12h" },
              { name: "Technical Issue", team: "IT Support", sla: "2h" },
              { name: "Urgent Issue", team: "On-Call", sla: "1h" },
              { name: "Client Comm", team: "Success", sla: "6h" },
            ].map((type) => (
              <Card key={type.name} className="text-center p-4 border-0 shadow-md">
                <p className="font-medium text-sm mb-1">{type.name}</p>
                <p className="text-xs text-muted-foreground">{type.team}</p>
                <Badge variant="secondary" className="mt-2 text-xs">{type.sla} SLA</Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="gradient-primary p-12 text-center text-primary-foreground">
              <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Office?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join the future of work automation. Zero manual work, 100% intelligent processing.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="h-12 px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Office Automation</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for CDM Smith — Demonstrating AI Agent Capabilities
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
