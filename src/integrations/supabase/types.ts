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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      brand_profiles: {
        Row: {
          business_id: string
          created_at: string
          currency: string
          font_family: string
          language: string
          logo_path: string | null
          primary_color: string
          secondary_color: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          currency?: string
          font_family?: string
          language?: string
          logo_path?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          currency?: string
          font_family?: string
          language?: string
          logo_path?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_services: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          custom_type: string | null
          id: string
          name: string
          onboarded: boolean
          owner_id: string
          status: Database["public"]["Enums"]["business_status"]
          type: Database["public"]["Enums"]["business_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_type?: string | null
          id?: string
          name: string
          onboarded?: boolean
          owner_id: string
          status?: Database["public"]["Enums"]["business_status"]
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_type?: string | null
          id?: string
          name?: string
          onboarded?: boolean
          owner_id?: string
          status?: Database["public"]["Enums"]["business_status"]
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
        }
        Relationships: []
      }
      custom_template_requests: {
        Row: {
          business_id: string
          created_at: string
          file_name: string
          file_path: string | null
          file_type: string | null
          id: string
          status: Database["public"]["Enums"]["template_request_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          file_name: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          status?: Database["public"]["Enums"]["template_request_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          file_name?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          status?: Database["public"]["Enums"]["template_request_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_template_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_template_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "custom_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_templates: {
        Row: {
          archived: boolean
          business_id: string
          created_at: string
          engine: string
          id: string
          name: string
          updated_at: string
          variant: Json
        }
        Insert: {
          archived?: boolean
          business_id: string
          created_at?: string
          engine: string
          id?: string
          name: string
          updated_at?: string
          variant?: Json
        }
        Update: {
          archived?: boolean
          business_id?: string
          created_at?: string
          engine?: string
          id?: string
          name?: string
          updated_at?: string
          variant?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          business_id: string
          content: Json
          created_at: string
          id: string
          image_path: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          content?: Json
          created_at?: string
          id?: string
          image_path?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          content?: Json
          created_at?: string
          id?: string
          image_path?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trial_usage: {
        Row: {
          business_id: string
          created_at: string
          free_post_limit: number
          posts_created: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          free_post_limit?: number
          posts_created?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          free_post_limit?: number
          posts_created?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_my_business: {
        Args: {
          _custom_type?: string
          _name: string
          _type: Database["public"]["Enums"]["business_type"]
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_member: { Args: { _business_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      my_business_id: { Args: never; Returns: string }
      register_post_usage: {
        Args: { _business_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "business_user"
      business_status: "pending" | "approved" | "rejected" | "suspended"
      business_type:
        | "travel_agency"
        | "real_estate"
        | "car_dealership"
        | "restaurant"
        | "retail"
        | "other"
      template_request_status: "processing" | "ready" | "rejected"
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
    Enums: {
      app_role: ["super_admin", "business_user"],
      business_status: ["pending", "approved", "rejected", "suspended"],
      business_type: [
        "travel_agency",
        "real_estate",
        "car_dealership",
        "restaurant",
        "retail",
        "other",
      ],
      template_request_status: ["processing", "ready", "rejected"],
    },
  },
} as const
