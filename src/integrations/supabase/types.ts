export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_metrics: {
        Row: {
          auto_classified: number | null
          auto_replied: number | null
          avg_response_time_minutes: number | null
          created_at: string | null
          escalated: number | null
          id: string
          metric_date: string
          request_types_breakdown: Json | null
          sla_breaches: number | null
          team_performance: Json | null
          total_emails: number | null
        }
        Insert: {
          auto_classified?: number | null
          auto_replied?: number | null
          avg_response_time_minutes?: number | null
          created_at?: string | null
          escalated?: number | null
          id?: string
          metric_date: string
          request_types_breakdown?: Json | null
          sla_breaches?: number | null
          team_performance?: Json | null
          total_emails?: number | null
        }
        Update: {
          auto_classified?: number | null
          auto_replied?: number | null
          avg_response_time_minutes?: number | null
          created_at?: string | null
          escalated?: number | null
          id?: string
          metric_date?: string
          request_types_breakdown?: Json | null
          sla_breaches?: number | null
          team_performance?: Json | null
          total_emails?: number | null
        }
        Relationships: []
      }
      auto_replies: {
        Row: {
          email_id: string | null
          id: string
          recipient: string
          reply_text: string
          sent_at: string | null
        }
        Insert: {
          email_id?: string | null
          id?: string
          recipient: string
          reply_text: string
          sent_at?: string | null
        }
        Update: {
          email_id?: string | null
          id?: string
          recipient?: string
          reply_text?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_replies_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_summaries: {
        Row: {
          completed_tasks_count: number | null
          created_at: string | null
          emails_processed: number | null
          id: string
          meetings_attended: number | null
          pending_tasks_count: number | null
          summary_date: string
          summary_text: string | null
          user_id: string
        }
        Insert: {
          completed_tasks_count?: number | null
          created_at?: string | null
          emails_processed?: number | null
          id?: string
          meetings_attended?: number | null
          pending_tasks_count?: number | null
          summary_date: string
          summary_text?: string | null
          user_id: string
        }
        Update: {
          completed_tasks_count?: number | null
          created_at?: string | null
          emails_processed?: number | null
          id?: string
          meetings_attended?: number | null
          pending_tasks_count?: number | null
          summary_date?: string
          summary_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_classifications: {
        Row: {
          auto_reply_sent: boolean | null
          classified_at: string | null
          confidence_score: number | null
          email_id: string | null
          escalated: boolean | null
          escalation_time: string | null
          id: string
          request_type_id: string | null
          routing_team: string | null
          urgency_level: string | null
        }
        Insert: {
          auto_reply_sent?: boolean | null
          classified_at?: string | null
          confidence_score?: number | null
          email_id?: string | null
          escalated?: boolean | null
          escalation_time?: string | null
          id?: string
          request_type_id?: string | null
          routing_team?: string | null
          urgency_level?: string | null
        }
        Update: {
          auto_reply_sent?: boolean | null
          classified_at?: string | null
          confidence_score?: number | null
          email_id?: string | null
          escalated?: boolean | null
          escalation_time?: string | null
          id?: string
          request_type_id?: string | null
          routing_team?: string | null
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_classifications_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_classifications_request_type_id_fkey"
            columns: ["request_type_id"]
            isOneToOne: false
            referencedRelation: "request_types"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body: string | null
          created_at: string | null
          email_id: string
          has_task: boolean | null
          id: string
          is_processed: boolean | null
          received_at: string
          sender: string
          subject: string
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          email_id: string
          has_task?: boolean | null
          id?: string
          is_processed?: boolean | null
          received_at: string
          sender: string
          subject: string
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          email_id?: string
          has_task?: boolean | null
          id?: string
          is_processed?: boolean | null
          received_at?: string
          sender?: string
          subject?: string
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      escalations: {
        Row: {
          email_id: string | null
          escalated_at: string | null
          escalated_to: string | null
          id: string
          reason: string
          resolved: boolean | null
          resolved_at: string | null
          team_assignment_id: string | null
        }
        Insert: {
          email_id?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          reason: string
          resolved?: boolean | null
          resolved_at?: string | null
          team_assignment_id?: string | null
        }
        Update: {
          email_id?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          reason?: string
          resolved?: boolean | null
          resolved_at?: string | null
          team_assignment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_team_assignment_id_fkey"
            columns: ["team_assignment_id"]
            isOneToOne: false
            referencedRelation: "team_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          attendees: Json | null
          auto_joined: boolean | null
          created_at: string | null
          end_time: string
          id: string
          join_url: string | null
          meeting_id: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendees?: Json | null
          auto_joined?: boolean | null
          created_at?: string | null
          end_time: string
          id?: string
          join_url?: string | null
          meeting_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendees?: Json | null
          auto_joined?: boolean | null
          created_at?: string | null
          end_time?: string
          id?: string
          join_url?: string | null
          meeting_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      request_types: {
        Row: {
          auto_reply_template: string | null
          category: string
          created_at: string | null
          escalation_rules: Json | null
          id: string
          keywords: string[] | null
          name: string
          routing_team: string | null
          sla_hours: number | null
        }
        Insert: {
          auto_reply_template?: string | null
          category: string
          created_at?: string | null
          escalation_rules?: Json | null
          id?: string
          keywords?: string[] | null
          name: string
          routing_team?: string | null
          sla_hours?: number | null
        }
        Update: {
          auto_reply_template?: string | null
          category?: string
          created_at?: string | null
          escalation_rules?: Json | null
          id?: string
          keywords?: string[] | null
          name?: string
          routing_team?: string | null
          sla_hours?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          email_id: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          email_id?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          email_id?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      team_assignments: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          assigned_at: string | null
          email_id: string | null
          id: string
          notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          response_time_minutes: number | null
          team_name: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          assigned_at?: string | null
          email_id?: string | null
          id?: string
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          response_time_minutes?: number | null
          team_name: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          assigned_at?: string | null
          email_id?: string | null
          id?: string
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          response_time_minutes?: number | null
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_assignments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_reply_enabled: boolean | null
          created_at: string | null
          daily_summary_time: string | null
          email_sync_enabled: boolean | null
          google_access_token: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          id: string
          microsoft_access_token: string | null
          microsoft_refresh_token: string | null
          microsoft_token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_reply_enabled?: boolean | null
          created_at?: string | null
          daily_summary_time?: string | null
          email_sync_enabled?: boolean | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          microsoft_access_token?: string | null
          microsoft_refresh_token?: string | null
          microsoft_token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_reply_enabled?: boolean | null
          created_at?: string | null
          daily_summary_time?: string | null
          email_sync_enabled?: boolean | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          microsoft_access_token?: string | null
          microsoft_refresh_token?: string | null
          microsoft_token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
