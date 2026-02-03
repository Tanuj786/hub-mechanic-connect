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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
          service_request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
          service_request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address: string
          created_at: string | null
          customer_id: string
          id: string
          is_default: boolean | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          address: string
          created_at?: string | null
          customer_id: string
          id?: string
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          address?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          invoice_number: string
          mechanic_id: string
          notes: string | null
          paid_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          service_request_id: string
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          invoice_number: string
          mechanic_id: string
          notes?: string | null
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          service_request_id: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          invoice_number?: string
          mechanic_id?: string
          notes?: string | null
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          service_request_id?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          count: number | null
          earned_at: string | null
          id: string
          mechanic_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          count?: number | null
          earned_at?: string | null
          id?: string
          mechanic_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          count?: number | null
          earned_at?: string | null
          id?: string
          mechanic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_achievements_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_services: {
        Row: {
          created_at: string | null
          id: string
          mechanic_id: string
          service_type_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mechanic_id: string
          service_type_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mechanic_id?: string
          service_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_services_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_services_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_settings: {
        Row: {
          created_at: string | null
          dark_mode: boolean | null
          id: string
          location_sharing: boolean | null
          mechanic_id: string
          push_notifications: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dark_mode?: boolean | null
          id?: string
          location_sharing?: boolean | null
          mechanic_id: string
          push_notifications?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dark_mode?: boolean | null
          id?: string
          location_sharing?: boolean | null
          mechanic_id?: string
          push_notifications?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_settings_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_shops: {
        Row: {
          average_rating: number | null
          created_at: string | null
          gst_number: string | null
          hourly_rate: number | null
          id: string
          is_online: boolean | null
          jobs_completed: number | null
          latitude: number | null
          longitude: number | null
          mechanic_id: string
          response_rate: number | null
          shop_address: string
          shop_description: string | null
          shop_name: string
          total_earnings: number | null
          total_reviews: number | null
          updated_at: string | null
          whatsapp_number: string | null
          years_of_experience: number | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string | null
          gst_number?: string | null
          hourly_rate?: number | null
          id?: string
          is_online?: boolean | null
          jobs_completed?: number | null
          latitude?: number | null
          longitude?: number | null
          mechanic_id: string
          response_rate?: number | null
          shop_address: string
          shop_description?: string | null
          shop_name: string
          total_earnings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          whatsapp_number?: string | null
          years_of_experience?: number | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string | null
          gst_number?: string | null
          hourly_rate?: number | null
          id?: string
          is_online?: boolean | null
          jobs_completed?: number | null
          latitude?: number | null
          longitude?: number | null
          mechanic_id?: string
          response_rate?: number | null
          shop_address?: string
          shop_description?: string | null
          shop_name?: string
          total_earnings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          whatsapp_number?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_shops_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_request_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_request_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_request_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_request_id_fkey"
            columns: ["related_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone_number: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone_number?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone_number?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          mechanic_id: string
          mechanic_response: string | null
          mechanic_response_at: string | null
          rating: number
          review: string | null
          service_request_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          mechanic_id: string
          mechanic_response?: string | null
          mechanic_response_at?: string | null
          rating: number
          review?: string | null
          service_request_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          mechanic_id?: string
          mechanic_response?: string | null
          mechanic_response_at?: string | null
          rating?: number
          review?: string | null
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string | null
          customer_address: string
          customer_id: string
          customer_latitude: number | null
          customer_longitude: number | null
          description: string | null
          estimated_cost: number | null
          final_cost: number | null
          id: string
          mechanic_id: string | null
          service_type_id: string
          status: Database["public"]["Enums"]["service_status"] | null
          updated_at: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_address: string
          customer_id: string
          customer_latitude?: number | null
          customer_longitude?: number | null
          description?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          mechanic_id?: string | null
          service_type_id: string
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_address?: string
          customer_id?: string
          customer_latitude?: number | null
          customer_longitude?: number | null
          description?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          mechanic_id?: string | null
          service_type_id?: string
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      work_media: {
        Row: {
          caption: string | null
          created_at: string
          file_type: string
          file_url: string
          id: string
          mechanic_id: string
          media_stage: string
          service_request_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          mechanic_id: string
          media_stage: string
          service_request_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          mechanic_id?: string
          media_stage?: string
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_media_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_media_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
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
      service_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      user_type: "customer" | "mechanic"
      vehicle_type: "car" | "bike" | "electric" | "battery" | "tyre" | "general"
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
      service_status: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      user_type: ["customer", "mechanic"],
      vehicle_type: ["car", "bike", "electric", "battery", "tyre", "general"],
    },
  },
} as const
