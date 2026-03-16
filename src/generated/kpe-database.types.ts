/**
 * Auto-generated TypeScript types for the KeepPlay Engine (KPE) database.
 * Project ref: dcffftbrcxnwarxpupdg
 *
 * DO NOT EDIT MANUALLY — regenerate via Supabase CLI or MCP tools.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type KpeDatabase = {
  public: {
    Tables: {
      ad_id_history: {
        Row: {
          id: string
          new_ad_id: string
          old_ad_id: string
          rotated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          new_ad_id: string
          old_ad_id: string
          rotated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          new_ad_id?: string
          old_ad_id?: string
          rotated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_id_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_fcm_tokens: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          fcm_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          fcm_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          fcm_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ad_revenue_events: {
        Row: {
          ad_type: string
          app_key_id: string
          coins_earned: number
          conversion_rate: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          revenue: number
          user_cut: number
          user_id: string
        }
        Insert: {
          ad_type: string
          app_key_id: string
          coins_earned: number
          conversion_rate: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          revenue: number
          user_cut: number
          user_id: string
        }
        Update: {
          ad_type?: string
          app_key_id?: string
          coins_earned?: number
          conversion_rate?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          revenue?: number
          user_cut?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_revenue_events_app_key_id_fkey"
            columns: ["app_key_id"]
            isOneToOne: false
            referencedRelation: "app_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_revenue_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          admin_role: string
          admin_user_id: string
          created_at: string
          description: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          ip_address: string
          request_metadata: Json | null
          resource_id: string | null
          resource_type: string
          severity: string
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_role: string
          admin_user_id: string
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          ip_address: string
          request_metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          severity?: string
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_role?: string
          admin_user_id?: string
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          ip_address?: string
          request_metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          severity?: string
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          key: string
          request_count: number
          window_start: number
        }
        Insert: {
          created_at?: string
          endpoint: string
          key: string
          request_count?: number
          window_start: number
        }
        Update: {
          created_at?: string
          endpoint?: string
          key?: string
          request_count?: number
          window_start?: number
        }
        Relationships: []
      }
      app_keys: {
        Row: {
          app_key_hash: string
          app_name: string
          app_type: string
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          app_key_hash: string
          app_name: string
          app_type: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          app_key_hash?: string
          app_name?: string
          app_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      daily_challenge_completions: {
        Row: {
          challenge_id: string
          claimed_at: string
          completed_date: string
          id: string
          reward_points: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          claimed_at?: string
          completed_date?: string
          id?: string
          reward_points: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          claimed_at?: string
          completed_date?: string
          id?: string
          reward_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "loyalty_daily_challenges_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_challenge_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoint_limits_config: {
        Row: {
          created_at: string
          description: string | null
          endpoint: string
          is_enabled: boolean
          max_requests: number
          updated_at: string
          window_seconds: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          endpoint: string
          is_enabled?: boolean
          max_requests: number
          updated_at?: string
          window_seconds: number
        }
        Update: {
          created_at?: string
          description?: string | null
          endpoint?: string
          is_enabled?: boolean
          max_requests?: number
          updated_at?: string
          window_seconds?: number
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          key_hash: string
          response: Json
        }
        Insert: {
          created_at?: string
          key_hash: string
          response: Json
        }
        Update: {
          created_at?: string
          key_hash?: string
          response?: Json
        }
        Relationships: []
      }
      loyalty_app_config: {
        Row: {
          category: string
          config_key: string
          config_value: string
          created_at: string
          description: string | null
          is_active: boolean
          updated_at: string
          value_type: string
        }
        Insert: {
          category?: string
          config_key: string
          config_value: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          updated_at?: string
          value_type?: string
        }
        Update: {
          category?: string
          config_key?: string
          config_value?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          updated_at?: string
          value_type?: string
        }
        Relationships: []
      }
      loyalty_daily_challenges_config: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          display_order: number
          icon_url: string
          id: string
          is_active: boolean
          reward_points: number
          target_game_name: string | null
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description: string
          display_order?: number
          icon_url?: string
          id?: string
          is_active?: boolean
          reward_points?: number
          target_game_name?: string | null
          target_value?: number
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          display_order?: number
          icon_url?: string
          id?: string
          is_active?: boolean
          reward_points?: number
          target_game_name?: string | null
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_games_config: {
        Row: {
          app_key_name: string | null
          created_at: string
          display_order: number
          game_icon_url: string | null
          game_url: string | null
          id: string
          image_url: string
          is_active: boolean
          package_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          app_key_name?: string | null
          created_at?: string
          display_order?: number
          game_icon_url?: string | null
          game_url?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          package_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          app_key_name?: string | null
          created_at?: string
          display_order?: number
          game_icon_url?: string | null
          game_url?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          package_name?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_config: {
        Row: {
          body_template: string
          config_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          title_template: string
          updated_at: string | null
        }
        Insert: {
          body_template: string
          config_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title_template: string
          updated_at?: string | null
        }
        Update: {
          body_template?: string
          config_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title_template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string
          config_key: string
          created_at: string | null
          error_message: string | null
          fcm_message_id: string | null
          id: string
          metadata: Json | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          config_key: string
          created_at?: string | null
          error_message?: string | null
          fcm_message_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          config_key?: string
          created_at?: string | null
          error_message?: string | null
          fcm_message_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_entries: {
        Row: {
          created_at: string
          endpoint: string
          key: string
          request_count: number
          window_start: number
        }
        Insert: {
          created_at?: string
          endpoint: string
          key: string
          request_count?: number
          window_start: number
        }
        Update: {
          created_at?: string
          endpoint?: string
          key?: string
          request_count?: number
          window_start?: number
        }
        Relationships: []
      }
      request_logs: {
        Row: {
          ad_id_hash: string | null
          app_key_id: string | null
          created_at: string
          duration_ms: number | null
          endpoint: string
          error_message: string | null
          id: string
          method: string
          request_metadata: Json | null
          status_code: number
        }
        Insert: {
          ad_id_hash?: string | null
          app_key_id?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          request_metadata?: Json | null
          status_code: number
        }
        Update: {
          ad_id_hash?: string | null
          app_key_id?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          request_metadata?: Json | null
          status_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "request_logs_app_key_id_fkey"
            columns: ["app_key_id"]
            isOneToOne: false
            referencedRelation: "app_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_game_earnings: {
        Row: {
          app_key_id: string
          created_at: string
          game_name: string
          id: string
          last_earned_at: string
          total_coins_earned: number
          total_events: number
          user_id: string
        }
        Insert: {
          app_key_id: string
          created_at?: string
          game_name: string
          id?: string
          last_earned_at?: string
          total_coins_earned?: number
          total_events?: number
          user_id: string
        }
        Update: {
          app_key_id?: string
          created_at?: string
          game_name?: string
          id?: string
          last_earned_at?: string
          total_coins_earned?: number
          total_events?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_game_earnings_app_key_id_fkey"
            columns: ["app_key_id"]
            isOneToOne: false
            referencedRelation: "app_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ad_id: string
          created_at: string
          fcm_token: string | null
          id: string
          platform: string
          status: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          fcm_token?: string | null
          id?: string
          platform?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          fcm_token?: string | null
          id?: string
          platform?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallet_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: number
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          game_name: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          source: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          game_name?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          source: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          game_name?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          source?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      withdrawal_methods: {
        Row: {
          badge_text: string
          created_at: string
          display_name: string
          fields_config: Json
          gradient_colors: Json
          id: string
          is_available: boolean
          is_coming_soon: boolean
          logo_asset: string
          logo_color: string | null
          logo_url: string
          method_key: string
          min_points: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          badge_text?: string
          created_at?: string
          display_name: string
          fields_config?: Json
          gradient_colors?: Json
          id?: string
          is_available?: boolean
          is_coming_soon?: boolean
          logo_asset: string
          logo_color?: string | null
          logo_url?: string
          method_key: string
          min_points: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          badge_text?: string
          created_at?: string
          display_name?: string
          fields_config?: Json
          gradient_colors?: Json
          id?: string
          is_available?: boolean
          is_coming_soon?: boolean
          logo_asset?: string
          logo_color?: string | null
          logo_url?: string
          method_key?: string
          min_points?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount_points: number
          balance_after: number
          balance_before: number
          created_at: string
          destination_hash: string
          destination_masked: string
          destination_salt: string | null
          destination_type: string
          id: string
          method_key: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
          wallet_id: string
          withdrawal_method_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_points: number
          balance_after: number
          balance_before: number
          created_at?: string
          destination_hash: string
          destination_masked: string
          destination_salt?: string | null
          destination_type: string
          id?: string
          method_key: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          wallet_id: string
          withdrawal_method_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_points?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          destination_hash?: string
          destination_masked?: string
          destination_salt?: string | null
          destination_type?: string
          id?: string
          method_key?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
          withdrawal_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_withdrawal_method_id_fkey"
            columns: ["withdrawal_method_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_dashboard_stats: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_get_user: { Args: { p_user_id: string }; Returns: Json }
      admin_list_users: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status?: string
        }
        Returns: Json
      }
      check_admin_rate_limit: {
        Args: {
          p_endpoint: string
          p_key: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_key: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: Json
      }
      check_user_registration: { Args: { p_ad_id: string }; Returns: Json }
      claim_daily_challenge: {
        Args: { p_ad_id: string; p_challenge_id: string }
        Returns: Json
      }
      cleanup_idempotency_keys: { Args: Record<PropertyKey, never>; Returns: undefined }
      cleanup_rate_limit_entries: { Args: Record<PropertyKey, never>; Returns: undefined }
      credit_wallet: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_reference_id?: string
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      debit_wallet: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_reference_id?: string
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      get_app_config: {
        Args: { p_category?: string }
        Returns: {
          category: string
          config_key: string
          config_value: string
          value_type: string
        }[]
      }
      get_daily_challenges: { Args: { p_ad_id: string }; Returns: Json }
      get_endpoint_limits: {
        Args: Record<PropertyKey, never>
        Returns: {
          endpoint: string
          max_requests: number
          window_seconds: number
        }[]
      }
      get_loyalty_games: {
        Args: Record<PropertyKey, never>
        Returns: {
          app_key_name: string
          display_order: number
          game_icon_url: string
          game_url: string
          id: string
          image_url: string
          package_name: string
          title: string
        }[]
      }
      get_notification_data: { Args: { p_ad_id: string }; Returns: Json }
      get_user_game_earnings: { Args: { p_ad_id: string }; Returns: Json }
      get_user_profile: { Args: { p_ad_id: string }; Returns: Json }
      get_wallet_balance: { Args: { p_ad_id: string }; Returns: Json }
      get_wallet_config: { Args: Record<PropertyKey, never>; Returns: Json }
      get_wallet_transactions: {
        Args: { p_ad_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_withdrawal_config: {
        Args: { p_default?: string; p_key: string }
        Returns: string
      }
      get_withdrawal_history: {
        Args: { p_ad_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_withdrawal_methods: { Args: Record<PropertyKey, never>; Returns: Json }
      log_admin_audit: {
        Args: {
          p_action: string
          p_admin_email: string
          p_admin_role: string
          p_admin_user_id: string
          p_description?: string
          p_duration_ms?: number
          p_error_message?: string
          p_ip_address?: string
          p_request_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
          p_severity?: string
          p_status_code?: number
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_notification: {
        Args: {
          p_body: string
          p_config_key: string
          p_error_message: string
          p_fcm_message_id: string
          p_metadata: Json
          p_status: string
          p_title: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_request: {
        Args: {
          p_ad_id_hash?: string
          p_app_key_id: string
          p_duration_ms?: number
          p_endpoint: string
          p_error_message?: string
          p_method: string
          p_request_metadata?: Json
          p_status_code: number
        }
        Returns: undefined
      }
      process_ad_revenue: {
        Args: {
          p_ad_id: string
          p_ad_type: string
          p_app_key_id: string
          p_app_name: string
          p_currency: string
          p_idempotency_key?: string
          p_metadata?: Json
          p_revenue: number
        }
        Returns: Json
      }
      register_user: {
        Args: { p_ad_id: string; p_platform?: string }
        Returns: Json
      }
      request_withdrawal: {
        Args: {
          p_ad_id: string
          p_amount_points: number
          p_destination_info: string
          p_destination_type?: string
          p_method_key: string
        }
        Returns: Json
      }
      rotate_user_ad_id: {
        Args: { p_new_ad_id: string; p_old_ad_id: string }
        Returns: Json
      }
      save_fcm_token: {
        Args: { p_ad_id: string; p_fcm_token: string }
        Returns: Json
      }
      upsert_user_profile: {
        Args: { p_ad_id: string; p_display_name: string }
        Returns: Json
      }
      validate_app_key: {
        Args: { p_key_hash: string }
        Returns: {
          key_app_name: string
          key_app_type: string
          key_id: string
        }[]
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

// ─────────────────────────────────────────────
// Convenience type aliases
// ─────────────────────────────────────────────

type KpePublicSchema = KpeDatabase["public"]

/** Row type for a KPE table */
export type KpeTables<T extends keyof KpePublicSchema["Tables"]> =
  KpePublicSchema["Tables"][T]["Row"]

/** Insert type for a KPE table */
export type KpeTablesInsert<T extends keyof KpePublicSchema["Tables"]> =
  KpePublicSchema["Tables"][T]["Insert"]

/** Update type for a KPE table */
export type KpeTablesUpdate<T extends keyof KpePublicSchema["Tables"]> =
  KpePublicSchema["Tables"][T]["Update"]

/** Function args for a KPE RPC */
export type KpeFunctionArgs<T extends keyof KpePublicSchema["Functions"]> =
  KpePublicSchema["Functions"][T]["Args"]

/** Function return type for a KPE RPC */
export type KpeFunctionReturns<T extends keyof KpePublicSchema["Functions"]> =
  KpePublicSchema["Functions"][T]["Returns"]
