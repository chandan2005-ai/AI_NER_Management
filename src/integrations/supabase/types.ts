export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      alert_deliveries: {
        Row: {
          alert_id: string;
          channel: string;
          created_at: string;
          error_message: string | null;
          id: string;
          provider: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          alert_id: string;
          channel: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          provider?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          alert_id?: string;
          channel?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          provider?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "alert_deliveries_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "official_alerts";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_label: string | null;
          created_at: string;
          detail: string | null;
          id: string;
          severity: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_label?: string | null;
          created_at?: string;
          detail?: string | null;
          id?: string;
          severity?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_label?: string | null;
          created_at?: string;
          detail?: string | null;
          id?: string;
          severity?: string;
        };
        Relationships: [];
      };
      authority_profiles: {
        Row: {
          approved_at: string;
          created_at: string;
          department: string | null;
          designation: string;
          mfa_enrolled: boolean;
          organization_name: string;
          organization_type: Database["public"]["Enums"]["authority_org_type"];
          region: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          approved_at?: string;
          created_at?: string;
          department?: string | null;
          designation: string;
          mfa_enrolled?: boolean;
          organization_name: string;
          organization_type: Database["public"]["Enums"]["authority_org_type"];
          region: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          approved_at?: string;
          created_at?: string;
          department?: string | null;
          designation?: string;
          mfa_enrolled?: boolean;
          organization_name?: string;
          organization_type?: Database["public"]["Enums"]["authority_org_type"];
          region?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      authority_requests: {
        Row: {
          contact_number: string | null;
          created_at: string;
          department: string | null;
          designation: string;
          id: string;
          official_email: string;
          organization_name: string;
          organization_type: Database["public"]["Enums"]["authority_org_type"];
          region: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["request_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          contact_number?: string | null;
          created_at?: string;
          department?: string | null;
          designation: string;
          id?: string;
          official_email: string;
          organization_name: string;
          organization_type: Database["public"]["Enums"]["authority_org_type"];
          region: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          contact_number?: string | null;
          created_at?: string;
          department?: string | null;
          designation?: string;
          id?: string;
          official_email?: string;
          organization_name?: string;
          organization_type?: Database["public"]["Enums"]["authority_org_type"];
          region?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      citizen_alert_prefs: {
        Row: {
          created_at: string;
          in_app_enabled: boolean;
          level_area: boolean;
          level_critical: boolean;
          level_general: boolean;
          level_very_high: boolean;
          location_consent: boolean;
          phone_number: string | null;
          phone_verified: boolean;
          push_enabled: boolean;
          sms_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          in_app_enabled?: boolean;
          level_area?: boolean;
          level_critical?: boolean;
          level_general?: boolean;
          level_very_high?: boolean;
          location_consent?: boolean;
          phone_number?: string | null;
          phone_verified?: boolean;
          push_enabled?: boolean;
          sms_enabled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          in_app_enabled?: boolean;
          level_area?: boolean;
          level_critical?: boolean;
          level_general?: boolean;
          level_very_high?: boolean;
          location_consent?: boolean;
          phone_number?: string | null;
          phone_verified?: boolean;
          push_enabled?: boolean;
          sms_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      hazard_reports: {
        Row: {
          created_at: string;
          description: string;
          district: string | null;
          hazard_type: string;
          id: string;
          lat: number | null;
          lng: number | null;
          location_attached: boolean;
          photo_url: string | null;
          severity: string;
          state: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          district?: string | null;
          hazard_type: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          location_attached?: boolean;
          photo_url?: string | null;
          severity?: string;
          state?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          district?: string | null;
          hazard_type?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          location_attached?: boolean;
          photo_url?: string | null;
          severity?: string;
          state?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      official_alerts: {
        Row: {
          created_at: string;
          created_by: string;
          delivered_count: number;
          failed_count: number;
          headline: string;
          id: string;
          level: Database["public"]["Enums"]["alert_level"];
          message: string;
          mfa_confirmed: boolean;
          recipients_total: number;
          safety_guidance: string | null;
          sent_at: string | null;
          status: Database["public"]["Enums"]["alert_status"];
          target_district: string | null;
          target_state: string | null;
          target_zone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          delivered_count?: number;
          failed_count?: number;
          headline: string;
          id?: string;
          level: Database["public"]["Enums"]["alert_level"];
          message: string;
          mfa_confirmed?: boolean;
          recipients_total?: number;
          safety_guidance?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["alert_status"];
          target_district?: string | null;
          target_state?: string | null;
          target_zone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          delivered_count?: number;
          failed_count?: number;
          headline?: string;
          id?: string;
          level?: Database["public"]["Enums"]["alert_level"];
          message?: string;
          mfa_confirmed?: boolean;
          recipients_total?: number;
          safety_guidance?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["alert_status"];
          target_district?: string | null;
          target_state?: string | null;
          target_zone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          district: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          preferred_language: string;
          state: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          district?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          preferred_language?: string;
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          district?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          preferred_language?: string;
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_approved_authority: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      alert_level: "information" | "watch" | "warning" | "critical";
      alert_status: "draft" | "queued" | "sent" | "failed";
      app_role: "citizen" | "authority" | "admin";
      authority_org_type:
        | "state_disaster_management_authority"
        | "district_disaster_management_authority"
        | "police"
        | "fire_and_emergency_services"
        | "public_works_department"
        | "government_administration"
        | "authorized_research_institution";
      request_status: "pending" | "organization_verified" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      alert_level: ["information", "watch", "warning", "critical"],
      alert_status: ["draft", "queued", "sent", "failed"],
      app_role: ["citizen", "authority", "admin"],
      authority_org_type: [
        "state_disaster_management_authority",
        "district_disaster_management_authority",
        "police",
        "fire_and_emergency_services",
        "public_works_department",
        "government_administration",
        "authorized_research_institution",
      ],
      request_status: ["pending", "organization_verified", "approved", "rejected"],
    },
  },
} as const;
