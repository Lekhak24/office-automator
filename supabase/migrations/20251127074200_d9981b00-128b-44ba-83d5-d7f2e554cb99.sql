-- Add request classification and routing tables
CREATE TABLE public.request_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  keywords TEXT[],
  routing_team TEXT,
  sla_hours INTEGER DEFAULT 24,
  auto_reply_template TEXT,
  escalation_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.email_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
  request_type_id UUID REFERENCES public.request_types(id),
  confidence_score DECIMAL(3,2),
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  routing_team TEXT,
  auto_reply_sent BOOLEAN DEFAULT false,
  escalated BOOLEAN DEFAULT false,
  escalation_time TIMESTAMPTZ,
  classified_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  response_time_minutes INTEGER,
  notes TEXT
);

CREATE TABLE public.auto_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  recipient TEXT NOT NULL
);

CREATE TABLE public.escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
  team_assignment_id UUID REFERENCES public.team_assignments(id),
  reason TEXT NOT NULL,
  escalated_to TEXT,
  escalated_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  total_emails INTEGER DEFAULT 0,
  auto_classified INTEGER DEFAULT 0,
  auto_replied INTEGER DEFAULT 0,
  escalated INTEGER DEFAULT 0,
  avg_response_time_minutes DECIMAL(10,2),
  sla_breaches INTEGER DEFAULT 0,
  request_types_breakdown JSONB,
  team_performance JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(metric_date)
);

-- Enable RLS
ALTER TABLE public.request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin access for now, refine later)
CREATE POLICY "Anyone can view request types"
  ON public.request_types FOR SELECT
  USING (true);

CREATE POLICY "Users can view email classifications"
  ON public.email_classifications FOR SELECT
  USING (true);

CREATE POLICY "Users can view team assignments"
  ON public.team_assignments FOR SELECT
  USING (true);

CREATE POLICY "Users can view auto replies"
  ON public.auto_replies FOR SELECT
  USING (true);

CREATE POLICY "Users can view escalations"
  ON public.escalations FOR SELECT
  USING (true);

CREATE POLICY "Users can view analytics"
  ON public.analytics_metrics FOR SELECT
  USING (true);

-- Insert default request types
INSERT INTO public.request_types (name, category, keywords, routing_team, sla_hours, auto_reply_template, escalation_rules) VALUES
('Leave Request', 'HR', ARRAY['leave', 'vacation', 'time off', 'PTO', 'absence'], 'HR Team', 8, 
 'Thank you for your leave request. Our HR team has been notified and will review your request shortly. You will receive confirmation within 8 hours.',
 '{"escalate_after_hours": 8, "escalate_to": "HR Manager"}'::jsonb),

('Access Request', 'IT', ARRAY['access', 'permission', 'sharepoint', 'vault', 'credentials'], 'IT Security', 4,
 'Your access request has been received and forwarded to our IT Security team. They will process your request and respond within 4 hours.',
 '{"escalate_after_hours": 4, "escalate_to": "IT Security Lead"}'::jsonb),

('Project Update', 'Projects', ARRAY['project', 'timeline', 'deliverable', 'milestone', 'deadline'], 'Project Management', 12,
 'Thank you for reaching out about the project. Your message has been forwarded to the project lead who will respond with an update within 12 hours.',
 '{"escalate_after_hours": 12, "escalate_to": "Project Director"}'::jsonb),

('Technical Issue', 'IT', ARRAY['error', 'bug', 'broken', 'not working', 'issue', 'problem'], 'IT Support', 2,
 'We have received your technical issue report. Our IT Support team is investigating and will provide assistance within 2 hours.',
 '{"escalate_after_hours": 2, "escalate_to": "IT Manager"}'::jsonb),

('Urgent Issue', 'Critical', ARRAY['urgent', 'critical', 'blocked', 'emergency', 'down', 'failing'], 'On-Call Team', 1,
 'URGENT: Your critical issue has been escalated to our on-call team. You will receive immediate assistance within 1 hour.',
 '{"escalate_after_hours": 1, "escalate_to": "Operations Director"}'::jsonb),

('Client Communication', 'Client Relations', ARRAY['client', 'customer', 'external', 'partner'], 'Client Success', 6,
 'Thank you for contacting us. Your message has been forwarded to our Client Success team who will respond within 6 hours.',
 '{"escalate_after_hours": 6, "escalate_to": "Client Success Manager"}'::jsonb);

-- Create indexes
CREATE INDEX idx_email_classifications_email ON public.email_classifications(email_id);
CREATE INDEX idx_team_assignments_team ON public.team_assignments(team_name);
CREATE INDEX idx_team_assignments_resolved ON public.team_assignments(resolved);
CREATE INDEX idx_escalations_resolved ON public.escalations(resolved);