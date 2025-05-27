export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          quantity: number | null
          service_id: string
          unit_price: number
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          quantity?: number | null
          service_id: string
          unit_price: number
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          quantity?: number | null
          service_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          professional_id: string
          start_time: string
          status: string | null
          total_duration: number
          total_value: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          professional_id: string
          start_time: string
          status?: string | null
          total_duration: number
          total_value: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          professional_id?: string
          start_time?: string
          status?: string | null
          total_duration?: number
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_periods: {
        Row: {
          created_at: string
          end_date: string
          end_time: string
          id: string
          professional_id: string
          reason: string | null
          start_date: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          end_time: string
          id?: string
          professional_id: string
          reason?: string | null
          start_date: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          end_time?: string
          id?: string
          professional_id?: string
          reason?: string | null
          start_date?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_periods_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expense_date: string
          id: string
          is_fixed: boolean
          name: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          is_fixed?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          is_fixed?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          professional_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          professional_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          professional_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          client_id: string
          commission_amount: number
          created_at: string
          date: string
          id: string
          payment_method: string | null
          professional_id: string
          service_id: string
          service_value: number
          tip_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          commission_amount: number
          created_at?: string
          date?: string
          id?: string
          payment_method?: string | null
          professional_id: string
          service_id: string
          service_value: number
          tip_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          commission_amount?: number
          created_at?: string
          date?: string
          id?: string
          payment_method?: string | null
          professional_id?: string
          service_id?: string
          service_value?: number
          tip_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          commission: number
          created_at: string
          description: string | null
          duration: number | null
          id: string
          image: string | null
          name: string
          price: number
          type: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          commission?: number
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          image?: string | null
          name: string
          price: number
          type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          commission?: number
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          image?: string | null
          name?: string
          price?: number
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          categories: string[] | null
          created_at: string
          email: string
          has_access: boolean
          id: string
          is_manager: boolean
          name: string
          phone: string | null
          profession: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          avatar?: string | null
          categories?: string[] | null
          created_at?: string
          email: string
          has_access?: boolean
          id: string
          is_manager?: boolean
          name: string
          phone?: string | null
          profession?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          avatar?: string | null
          categories?: string[] | null
          created_at?: string
          email?: string
          has_access?: boolean
          id?: string
          is_manager?: boolean
          name?: string
          phone?: string | null
          profession?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_authenticated_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
