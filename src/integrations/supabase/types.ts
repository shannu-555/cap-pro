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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      competitor_data: {
        Row: {
          competitor_name: string
          created_at: string
          features: Json | null
          id: string
          last_updated: string
          price: number | null
          query_id: string
          rating: number | null
          url: string | null
        }
        Insert: {
          competitor_name: string
          created_at?: string
          features?: Json | null
          id?: string
          last_updated?: string
          price?: number | null
          query_id: string
          rating?: number | null
          url?: string | null
        }
        Update: {
          competitor_name?: string
          created_at?: string
          features?: Json | null
          id?: string
          last_updated?: string
          price?: number | null
          query_id?: string
          rating?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_data_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "research_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_queries: {
        Row: {
          created_at: string
          id: string
          query_text: string
          query_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query_text: string
          query_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query_text?: string
          query_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_reports: {
        Row: {
          created_at: string
          id: string
          insights: Json | null
          pdf_url: string | null
          query_id: string
          recommendations: Json | null
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          insights?: Json | null
          pdf_url?: string | null
          query_id: string
          recommendations?: Json | null
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          insights?: Json | null
          pdf_url?: string | null
          query_id?: string
          recommendations?: Json | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_reports_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "research_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      sentiment_analysis: {
        Row: {
          confidence: number
          content: string
          created_at: string
          id: string
          query_id: string
          sentiment: string
          source: string
          topics: string[] | null
        }
        Insert: {
          confidence?: number
          content: string
          created_at?: string
          id?: string
          query_id: string
          sentiment: string
          source: string
          topics?: string[] | null
        }
        Update: {
          confidence?: number
          content?: string
          created_at?: string
          id?: string
          query_id?: string
          sentiment?: string
          source?: string
          topics?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_analysis_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "research_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_data: {
        Row: {
          created_at: string
          data_points: Json | null
          id: string
          keyword: string
          query_id: string
          search_volume: number | null
          time_period: string
          trend_direction: string | null
        }
        Insert: {
          created_at?: string
          data_points?: Json | null
          id?: string
          keyword: string
          query_id: string
          search_volume?: number | null
          time_period: string
          trend_direction?: string | null
        }
        Update: {
          created_at?: string
          data_points?: Json | null
          id?: string
          keyword?: string
          query_id?: string
          search_volume?: number | null
          time_period?: string
          trend_direction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_data_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "research_queries"
            referencedColumns: ["id"]
          },
        ]
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
