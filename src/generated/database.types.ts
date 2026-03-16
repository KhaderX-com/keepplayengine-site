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
      achievements: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          key: string
          name: string
          requirement_type: string
          requirement_value: number
          reward_cents: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name: string
          requirement_type: string
          requirement_value: number
          reward_cents?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          reward_cents?: number | null
        }
        Relationships: []
      }
      admin_fcm_tokens: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ad_events: {
        Row: {
          ad_network: Database["public"]["Enums"]["ad_network"]
          ad_type: Database["public"]["Enums"]["ad_type"]
          ad_unit_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          device_id: string
          event_nonce: string
          game_id: string
          id: string
          is_validated: boolean | null
          placement_id: string | null
          player_id: string
          request_signature: string
          requested_at: string | null
          revenue_microcents: number | null
          reward_cents: number | null
          reward_multiplier: number | null
          session_id: string
          shown_at: string | null
          validation_errors: Json | null
          was_clicked: boolean | null
          was_completed: boolean | null
          was_skipped: boolean | null
          watch_duration_ms: number | null
        }
        Insert: {
          ad_network: Database["public"]["Enums"]["ad_network"]
          ad_type: Database["public"]["Enums"]["ad_type"]
          ad_unit_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          device_id: string
          event_nonce: string
          game_id: string
          id?: string
          is_validated?: boolean | null
          placement_id?: string | null
          player_id: string
          request_signature: string
          requested_at?: string | null
          revenue_microcents?: number | null
          reward_cents?: number | null
          reward_multiplier?: number | null
          session_id: string
          shown_at?: string | null
          validation_errors?: Json | null
          was_clicked?: boolean | null
          was_completed?: boolean | null
          was_skipped?: boolean | null
          watch_duration_ms?: number | null
        }
        Update: {
          ad_network?: Database["public"]["Enums"]["ad_network"]
          ad_type?: Database["public"]["Enums"]["ad_type"]
          ad_unit_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          device_id?: string
          event_nonce?: string
          game_id?: string
          id?: string
          is_validated?: boolean | null
          placement_id?: string | null
          player_id?: string
          request_signature?: string
          requested_at?: string | null
          revenue_microcents?: number | null
          reward_cents?: number | null
          reward_multiplier?: number | null
          session_id?: string
          shown_at?: string | null
          validation_errors?: Json | null
          was_clicked?: boolean | null
          was_completed?: boolean | null
          was_skipped?: boolean | null
          watch_duration_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string
          changes: Json | null
          created_at: string
          description: string | null
          id: string
          ip_address: string
          resource_id: string | null
          resource_type: string
          severity: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          changes?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address: string
          resource_id?: string | null
          resource_type: string
          severity?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          changes?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string
          resource_id?: string | null
          resource_type?: string
          severity?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_conversations: {
        Row: {
          created_at: string | null
          id: string
          is_group: boolean | null
          last_message_at: string | null
          last_message_id: string | null
          last_message_preview: string | null
          participant_ids: string[]
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_preview?: string | null
          participant_ids: string[]
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_preview?: string | null
          participant_ids?: string[]
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_login_attempts: {
        Row: {
          admin_user_id: string | null
          attempt_type: string
          created_at: string
          device_info: Json | null
          email: string
          failure_reason: string | null
          geo_location: Json | null
          id: string
          ip_address: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          admin_user_id?: string | null
          attempt_type?: string
          created_at?: string
          device_info?: Json | null
          email: string
          failure_reason?: string | null
          geo_location?: Json | null
          id?: string
          ip_address: string
          success: boolean
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string | null
          attempt_type?: string
          created_at?: string
          device_info?: Json | null
          email?: string
          failure_reason?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: string
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_login_attempts_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          attachments: Json | null
          content: string
          content_type: string | null
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          reactions: Json | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          content_type?: string | null
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          reactions?: Json | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          content_type?: string | null
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          reactions?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "admin_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_password_resets: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_password_resets_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_system_role: boolean
          name: Database["public"]["Enums"]["admin_role_type"]
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_system_role?: boolean
          name: Database["public"]["Enums"]["admin_role_type"]
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_system_role?: boolean
          name?: Database["public"]["Enums"]["admin_role_type"]
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: string
          is_revoked: boolean
          last_activity_at: string
          revoked_at: string | null
          revoked_reason: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address: string
          is_revoked?: boolean
          last_activity_at?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: string
          is_revoked?: boolean
          last_activity_at?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          avatar_url: string | null
          backup_codes: string[] | null
          biometric_enabled: boolean
          created_at: string
          created_by: string | null
          email: string
          email_verified: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_locked: boolean
          last_login_at: string | null
          last_login_ip: string | null
          lock_reason: string | null
          locked_until: string | null
          metadata: Json | null
          must_change_password: boolean
          password_changed_at: string
          password_hash: string
          role: Database["public"]["Enums"]["admin_role_type"]
          two_factor_enabled: boolean
          two_factor_secret: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          backup_codes?: string[] | null
          biometric_enabled?: boolean
          created_at?: string
          created_by?: string | null
          email: string
          email_verified?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          last_login_at?: string | null
          last_login_ip?: string | null
          lock_reason?: string | null
          locked_until?: string | null
          metadata?: Json | null
          must_change_password?: boolean
          password_changed_at?: string
          password_hash: string
          role?: Database["public"]["Enums"]["admin_role_type"]
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          backup_codes?: string[] | null
          biometric_enabled?: boolean
          created_at?: string
          created_by?: string | null
          email?: string
          email_verified?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          last_login_at?: string | null
          last_login_ip?: string | null
          lock_reason?: string | null
          locked_until?: string | null
          metadata?: Json | null
          must_change_password?: boolean
          password_changed_at?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["admin_role_type"]
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_config: {
        Row: {
          allow_enrollment: boolean
          biometric_enabled: boolean
          id: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_enrollment?: boolean
          biometric_enabled?: boolean
          id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_enrollment?: boolean
          biometric_enabled?: boolean
          id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      conversation_read_status: {
        Row: {
          admin_user_id: string
          conversation_id: string
          id: string
          last_read_at: string | null
          last_read_message_id: string | null
        }
        Insert: {
          admin_user_id: string
          conversation_id: string
          id?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
        }
        Update: {
          admin_user_id?: string
          conversation_id?: string
          id?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_read_status_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_read_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "admin_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_read_status_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          accessibility_overlay_risk: boolean | null
          active_accessibility_services: number | null
          active_display_count: number | null
          app_build_number: string | null
          app_version: string | null
          attestation_verdict: string | null
          battery_level: number | null
          binding_changed_attributes: Json | null
          binding_digest: string | null
          binding_drift_score: number | null
          binding_first: boolean | null
          binding_valid: boolean | null
          can_mock_location: boolean | null
          carrier: string | null
          carrier_name: string | null
          clone_confidence: number | null
          clone_environment: string | null
          clone_indicators: Json | null
          connection_type: string | null
          cpu_architecture: string | null
          cpu_cores: number | null
          created_at: string | null
          device_fingerprint: string
          device_manufacturer: string | null
          device_model: string | null
          device_profile: Json | null
          emulator_confidence: number | null
          emulator_indicators: Json | null
          first_seen_at: string | null
          first_seen_ip: unknown
          fraud_risk_score: number | null
          fraud_trust_level: string | null
          free_disk_space_gb: number | null
          geo_location: Json | null
          hardware_info: Json | null
          has_developer_options: boolean | null
          has_hooking_frameworks: boolean | null
          has_mock_location: boolean | null
          has_overlay_risk: boolean | null
          has_suspicious_accessibility: boolean | null
          has_timing_anomaly: boolean | null
          id: string
          install_id: string | null
          install_source: string | null
          is_anonymized: boolean | null
          is_app_intact: boolean | null
          is_cloned: boolean | null
          is_debuggable: boolean | null
          is_debugger_attached: boolean | null
          is_deep_rooted: boolean | null
          is_developer_mode_enabled: boolean | null
          is_emulator: boolean | null
          is_jailbroken: boolean | null
          is_proxy_configured: boolean | null
          is_rooted: boolean | null
          is_screen_capture_risk: boolean | null
          is_signature_valid: boolean | null
          is_tampered: boolean | null
          is_trusted_source: boolean | null
          is_vpn_active: boolean | null
          last_active_at: string | null
          last_seen_ip: unknown
          locale: string | null
          meets_basic_integrity: boolean | null
          meets_device_integrity: boolean | null
          memory_size_mb: number | null
          mobile_country_code: string | null
          mobile_network_code: string | null
          os_version: string | null
          platform: string
          player_id: string
          processor_count: number | null
          root_confidence: number | null
          root_indicators: Json | null
          root_method: string | null
          screen_density: number | null
          screen_dpi: number | null
          screen_height: number | null
          screen_width: number | null
          security_assessment: Json | null
          security_breakdown: Json | null
          security_events: Json | null
          security_recommendation: string | null
          security_risk_score: number | null
          security_should_block: boolean | null
          security_should_warn: boolean | null
          security_trust_level: string | null
          signing_secret: string | null
          suspicious_apps: Json | null
          suspicious_libraries: Json | null
          suspicious_ports: Json | null
          tampering_confidence: number | null
          tampering_indicators: Json | null
          tampering_tools: Json | null
          timezone: string | null
          total_disk_space_gb: number | null
          total_ram_gb: number | null
          trust_factors: Json | null
          trust_level: Database["public"]["Enums"]["device_trust_level"] | null
          trust_score: number | null
          updated_at: string | null
          vpn_interface_names: Json | null
          wifi_bssid: string | null
          wifi_ssid: string | null
        }
        Insert: {
          accessibility_overlay_risk?: boolean | null
          active_accessibility_services?: number | null
          active_display_count?: number | null
          app_build_number?: string | null
          app_version?: string | null
          attestation_verdict?: string | null
          battery_level?: number | null
          binding_changed_attributes?: Json | null
          binding_digest?: string | null
          binding_drift_score?: number | null
          binding_first?: boolean | null
          binding_valid?: boolean | null
          can_mock_location?: boolean | null
          carrier?: string | null
          carrier_name?: string | null
          clone_confidence?: number | null
          clone_environment?: string | null
          clone_indicators?: Json | null
          connection_type?: string | null
          cpu_architecture?: string | null
          cpu_cores?: number | null
          created_at?: string | null
          device_fingerprint: string
          device_manufacturer?: string | null
          device_model?: string | null
          device_profile?: Json | null
          emulator_confidence?: number | null
          emulator_indicators?: Json | null
          first_seen_at?: string | null
          first_seen_ip?: unknown
          fraud_risk_score?: number | null
          fraud_trust_level?: string | null
          free_disk_space_gb?: number | null
          geo_location?: Json | null
          hardware_info?: Json | null
          has_developer_options?: boolean | null
          has_hooking_frameworks?: boolean | null
          has_mock_location?: boolean | null
          has_overlay_risk?: boolean | null
          has_suspicious_accessibility?: boolean | null
          has_timing_anomaly?: boolean | null
          id?: string
          install_id?: string | null
          install_source?: string | null
          is_anonymized?: boolean | null
          is_app_intact?: boolean | null
          is_cloned?: boolean | null
          is_debuggable?: boolean | null
          is_debugger_attached?: boolean | null
          is_deep_rooted?: boolean | null
          is_developer_mode_enabled?: boolean | null
          is_emulator?: boolean | null
          is_jailbroken?: boolean | null
          is_proxy_configured?: boolean | null
          is_rooted?: boolean | null
          is_screen_capture_risk?: boolean | null
          is_signature_valid?: boolean | null
          is_tampered?: boolean | null
          is_trusted_source?: boolean | null
          is_vpn_active?: boolean | null
          last_active_at?: string | null
          last_seen_ip?: unknown
          locale?: string | null
          meets_basic_integrity?: boolean | null
          meets_device_integrity?: boolean | null
          memory_size_mb?: number | null
          mobile_country_code?: string | null
          mobile_network_code?: string | null
          os_version?: string | null
          platform: string
          player_id: string
          processor_count?: number | null
          root_confidence?: number | null
          root_indicators?: Json | null
          root_method?: string | null
          screen_density?: number | null
          screen_dpi?: number | null
          screen_height?: number | null
          screen_width?: number | null
          security_assessment?: Json | null
          security_breakdown?: Json | null
          security_events?: Json | null
          security_recommendation?: string | null
          security_risk_score?: number | null
          security_should_block?: boolean | null
          security_should_warn?: boolean | null
          security_trust_level?: string | null
          signing_secret?: string | null
          suspicious_apps?: Json | null
          suspicious_libraries?: Json | null
          suspicious_ports?: Json | null
          tampering_confidence?: number | null
          tampering_indicators?: Json | null
          tampering_tools?: Json | null
          timezone?: string | null
          total_disk_space_gb?: number | null
          total_ram_gb?: number | null
          trust_factors?: Json | null
          trust_level?: Database["public"]["Enums"]["device_trust_level"] | null
          trust_score?: number | null
          updated_at?: string | null
          vpn_interface_names?: Json | null
          wifi_bssid?: string | null
          wifi_ssid?: string | null
        }
        Update: {
          accessibility_overlay_risk?: boolean | null
          active_accessibility_services?: number | null
          active_display_count?: number | null
          app_build_number?: string | null
          app_version?: string | null
          attestation_verdict?: string | null
          battery_level?: number | null
          binding_changed_attributes?: Json | null
          binding_digest?: string | null
          binding_drift_score?: number | null
          binding_first?: boolean | null
          binding_valid?: boolean | null
          can_mock_location?: boolean | null
          carrier?: string | null
          carrier_name?: string | null
          clone_confidence?: number | null
          clone_environment?: string | null
          clone_indicators?: Json | null
          connection_type?: string | null
          cpu_architecture?: string | null
          cpu_cores?: number | null
          created_at?: string | null
          device_fingerprint?: string
          device_manufacturer?: string | null
          device_model?: string | null
          device_profile?: Json | null
          emulator_confidence?: number | null
          emulator_indicators?: Json | null
          first_seen_at?: string | null
          first_seen_ip?: unknown
          fraud_risk_score?: number | null
          fraud_trust_level?: string | null
          free_disk_space_gb?: number | null
          geo_location?: Json | null
          hardware_info?: Json | null
          has_developer_options?: boolean | null
          has_hooking_frameworks?: boolean | null
          has_mock_location?: boolean | null
          has_overlay_risk?: boolean | null
          has_suspicious_accessibility?: boolean | null
          has_timing_anomaly?: boolean | null
          id?: string
          install_id?: string | null
          install_source?: string | null
          is_anonymized?: boolean | null
          is_app_intact?: boolean | null
          is_cloned?: boolean | null
          is_debuggable?: boolean | null
          is_debugger_attached?: boolean | null
          is_deep_rooted?: boolean | null
          is_developer_mode_enabled?: boolean | null
          is_emulator?: boolean | null
          is_jailbroken?: boolean | null
          is_proxy_configured?: boolean | null
          is_rooted?: boolean | null
          is_screen_capture_risk?: boolean | null
          is_signature_valid?: boolean | null
          is_tampered?: boolean | null
          is_trusted_source?: boolean | null
          is_vpn_active?: boolean | null
          last_active_at?: string | null
          last_seen_ip?: unknown
          locale?: string | null
          meets_basic_integrity?: boolean | null
          meets_device_integrity?: boolean | null
          memory_size_mb?: number | null
          mobile_country_code?: string | null
          mobile_network_code?: string | null
          os_version?: string | null
          platform?: string
          player_id?: string
          processor_count?: number | null
          root_confidence?: number | null
          root_indicators?: Json | null
          root_method?: string | null
          screen_density?: number | null
          screen_dpi?: number | null
          screen_height?: number | null
          screen_width?: number | null
          security_assessment?: Json | null
          security_breakdown?: Json | null
          security_events?: Json | null
          security_recommendation?: string | null
          security_risk_score?: number | null
          security_should_block?: boolean | null
          security_should_warn?: boolean | null
          security_trust_level?: string | null
          signing_secret?: string | null
          suspicious_apps?: Json | null
          suspicious_libraries?: Json | null
          suspicious_ports?: Json | null
          tampering_confidence?: number | null
          tampering_indicators?: Json | null
          tampering_tools?: Json | null
          timezone?: string | null
          total_disk_space_gb?: number | null
          total_ram_gb?: number | null
          trust_factors?: Json | null
          trust_level?: Database["public"]["Enums"]["device_trust_level"] | null
          trust_score?: number | null
          updated_at?: string | null
          vpn_interface_names?: Json | null
          wifi_bssid?: string | null
          wifi_ssid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_flags: {
        Row: {
          action_taken: string | null
          confidence: number | null
          created_at: string | null
          description: string
          device_id: string | null
          evidence: Json | null
          flag_type: Database["public"]["Enums"]["fraud_flag_type"]
          id: string
          is_resolved: boolean | null
          player_id: string
          points_deducted: number | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          severity: number | null
          was_false_positive: boolean | null
        }
        Insert: {
          action_taken?: string | null
          confidence?: number | null
          created_at?: string | null
          description: string
          device_id?: string | null
          evidence?: Json | null
          flag_type: Database["public"]["Enums"]["fraud_flag_type"]
          id?: string
          is_resolved?: boolean | null
          player_id: string
          points_deducted?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: number | null
          was_false_positive?: boolean | null
        }
        Update: {
          action_taken?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string
          device_id?: string | null
          evidence?: Json | null
          flag_type?: Database["public"]["Enums"]["fraud_flag_type"]
          id?: string
          is_resolved?: boolean | null
          player_id?: string
          points_deducted?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: number | null
          was_false_positive?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          ads_watched: number | null
          client_ip: unknown
          coins_earned_cents: number | null
          created_at: string | null
          device_id: string
          duration_seconds: number | null
          ended_at: string | null
          fraud_flags: Json | null
          game_id: string
          geo_city: string | null
          geo_country: string | null
          id: string
          invalidation_reason: string | null
          is_valid: boolean | null
          levels_completed: number | null
          player_id: string
          sdk_version: string | null
          session_token: string
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          ads_watched?: number | null
          client_ip?: unknown
          coins_earned_cents?: number | null
          created_at?: string | null
          device_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          fraud_flags?: Json | null
          game_id: string
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          invalidation_reason?: string | null
          is_valid?: boolean | null
          levels_completed?: number | null
          player_id: string
          sdk_version?: string | null
          session_token: string
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          ads_watched?: number | null
          client_ip?: unknown
          coins_earned_cents?: number | null
          created_at?: string | null
          device_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          fraud_flags?: Json | null
          game_id?: string
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          invalidation_reason?: string | null
          is_valid?: boolean | null
          levels_completed?: number | null
          player_id?: string
          sdk_version?: string | null
          session_token?: string
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          app_store_url: string | null
          bundle_id: string
          created_at: string | null
          description: string | null
          game_key: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_daily_rewards_cents: number | null
          min_ad_interval_seconds: number | null
          name: string
          play_store_url: string | null
          released_at: string | null
          revenue_share_bps: number | null
          sdk_secret_hash: string
          sdk_version_min: string | null
          total_ad_revenue_cents: number | null
          total_players: number | null
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          app_store_url?: string | null
          bundle_id: string
          created_at?: string | null
          description?: string | null
          game_key: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_daily_rewards_cents?: number | null
          min_ad_interval_seconds?: number | null
          name: string
          play_store_url?: string | null
          released_at?: string | null
          revenue_share_bps?: number | null
          sdk_secret_hash: string
          sdk_version_min?: string | null
          total_ad_revenue_cents?: number | null
          total_players?: number | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          app_store_url?: string | null
          bundle_id?: string
          created_at?: string | null
          description?: string | null
          game_key?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_daily_rewards_cents?: number | null
          min_ad_interval_seconds?: number | null
          name?: string
          play_store_url?: string | null
          released_at?: string | null
          revenue_share_bps?: number | null
          sdk_secret_hash?: string
          sdk_version_min?: string | null
          total_ad_revenue_cents?: number | null
          total_players?: number | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          progress_percentage: number | null
          status: string | null
          target_date: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          progress_percentage?: number | null
          status?: string | null
          target_date?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          progress_percentage?: number | null
          status?: string | null
          target_date?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_log: {
        Row: {
          channel: string
          created_at: string | null
          delivered_at: string | null
          email_message_id: string | null
          error_message: string | null
          id: string
          notification_id: string
          push_subscription_id: string | null
          retry_count: number | null
          status: Database["public"]["Enums"]["delivery_status"] | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          email_message_id?: string | null
          error_message?: string | null
          id?: string
          notification_id: string
          push_subscription_id?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          email_message_id?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string
          push_subscription_id?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          admin_user_id: string
          created_at: string | null
          email_digest_enabled: boolean | null
          email_digest_frequency: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          quiet_hours_timezone: string | null
          type_preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          email_digest_enabled?: boolean | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          type_preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          email_digest_enabled?: boolean | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          type_preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: true
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived_at: string | null
          created_at: string | null
          expires_at: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"] | null
          read_at: string | null
          recipient_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          admin_notes: string | null
          amount_cents: number
          completed_at: string | null
          created_at: string | null
          failed_at: string | null
          failure_reason: string | null
          fee_cents: number | null
          id: string
          kyc_verified: boolean | null
          method: Database["public"]["Enums"]["payout_method"]
          net_amount_cents: number | null
          payout_address: string
          player_id: string
          processed_at: string | null
          processor_reference: string | null
          processor_response: Json | null
          requested_at: string | null
          requires_kyc: boolean | null
          retry_count: number | null
          status: Database["public"]["Enums"]["payout_status"] | null
          status_history: Json | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_cents: number
          completed_at?: string | null
          created_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          fee_cents?: number | null
          id?: string
          kyc_verified?: boolean | null
          method: Database["public"]["Enums"]["payout_method"]
          net_amount_cents?: number | null
          payout_address: string
          player_id: string
          processed_at?: string | null
          processor_reference?: string | null
          processor_response?: Json | null
          requested_at?: string | null
          requires_kyc?: boolean | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          status_history?: Json | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_cents?: number
          completed_at?: string | null
          created_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          fee_cents?: number | null
          id?: string
          kyc_verified?: boolean | null
          method?: Database["public"]["Enums"]["payout_method"]
          net_amount_cents?: number | null
          payout_address?: string
          player_id?: string
          processed_at?: string | null
          processor_reference?: string | null
          processor_response?: Json | null
          requested_at?: string | null
          requires_kyc?: boolean | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          status_history?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_achievements: {
        Row: {
          achievement_id: string
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          id: string
          is_completed: boolean | null
          player_id: string
          reward_claimed: boolean | null
          reward_claimed_at: string | null
          updated_at: string | null
        }
        Insert: {
          achievement_id: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_completed?: boolean | null
          player_id: string
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          achievement_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_completed?: boolean | null
          player_id?: string
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_url: string | null
          balance_cents: number | null
          country_code: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          external_id: string
          first_seen_at: string | null
          fraud_flags: Json | null
          fraud_score: number | null
          id: string
          kyc_verified: boolean | null
          kyc_verified_at: string | null
          language_code: string | null
          last_active_at: string | null
          last_fraud_check_at: string | null
          lifetime_earned_cents: number | null
          lifetime_withdrawn_cents: number | null
          pending_payout_cents: number | null
          phone: string | null
          phone_verified: boolean | null
          referral_code: string | null
          referral_count: number | null
          referred_by_player_id: string | null
          status: Database["public"]["Enums"]["player_status"] | null
          status_changed_at: string | null
          status_reason: string | null
          timezone: string | null
          total_ads_watched: number | null
          total_games_played: number | null
          total_play_time_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance_cents?: number | null
          country_code?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          external_id: string
          first_seen_at?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          id?: string
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          language_code?: string | null
          last_active_at?: string | null
          last_fraud_check_at?: string | null
          lifetime_earned_cents?: number | null
          lifetime_withdrawn_cents?: number | null
          pending_payout_cents?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by_player_id?: string | null
          status?: Database["public"]["Enums"]["player_status"] | null
          status_changed_at?: string | null
          status_reason?: string | null
          timezone?: string | null
          total_ads_watched?: number | null
          total_games_played?: number | null
          total_play_time_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance_cents?: number | null
          country_code?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          external_id?: string
          first_seen_at?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          id?: string
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          language_code?: string | null
          last_active_at?: string | null
          last_fraud_check_at?: string | null
          lifetime_earned_cents?: number | null
          lifetime_withdrawn_cents?: number | null
          pending_payout_cents?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by_player_id?: string | null
          status?: Database["public"]["Enums"]["player_status"] | null
          status_changed_at?: string | null
          status_reason?: string | null
          timezone?: string | null
          total_ads_watched?: number | null
          total_games_played?: number | null
          total_play_time_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_referred_by_player_id_fkey"
            columns: ["referred_by_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          admin_user_id: string
          auth_key: string
          created_at: string | null
          device_name: string | null
          device_type: string | null
          endpoint: string
          failed_attempts: number | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          p256dh_key: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          auth_key: string
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          endpoint: string
          failed_attempts?: number | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh_key: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          auth_key?: string
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          endpoint?: string
          failed_attempts?: number | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          p256dh_key?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          block_reason: string | null
          blocked_until: string | null
          endpoint: string
          id: string
          identifier: string
          identifier_type: string
          is_blocked: boolean | null
          max_requests: number
          request_count: number | null
          window_seconds: number
          window_start: string | null
        }
        Insert: {
          block_reason?: string | null
          blocked_until?: string | null
          endpoint: string
          id?: string
          identifier: string
          identifier_type: string
          is_blocked?: boolean | null
          max_requests: number
          request_count?: number | null
          window_seconds: number
          window_start?: string | null
        }
        Update: {
          block_reason?: string | null
          blocked_until?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          identifier_type?: string
          is_blocked?: boolean | null
          max_requests?: number
          request_count?: number | null
          window_seconds?: number
          window_start?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          fraud_check_notes: string | null
          id: string
          is_qualified: boolean | null
          is_suspicious: boolean | null
          qualified_at: string | null
          referral_code: string
          referral_source: string | null
          referred_id: string
          referred_reward_cents: number | null
          referrer_id: string
          referrer_reward_cents: number | null
          rewards_paid: boolean | null
          rewards_paid_at: string | null
        }
        Insert: {
          created_at?: string | null
          fraud_check_notes?: string | null
          id?: string
          is_qualified?: boolean | null
          is_suspicious?: boolean | null
          qualified_at?: string | null
          referral_code: string
          referral_source?: string | null
          referred_id: string
          referred_reward_cents?: number | null
          referrer_id: string
          referrer_reward_cents?: number | null
          rewards_paid?: boolean | null
          rewards_paid_at?: string | null
        }
        Update: {
          created_at?: string | null
          fraud_check_notes?: string | null
          id?: string
          is_qualified?: boolean | null
          is_suspicious?: boolean | null
          qualified_at?: string | null
          referral_code?: string
          referral_source?: string | null
          referred_id?: string
          referred_reward_cents?: number | null
          referrer_id?: string
          referrer_reward_cents?: number | null
          rewards_paid?: boolean | null
          rewards_paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      sdk_api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          game_id: string
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          permissions: Json | null
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          revoked_at: string | null
          revoked_reason: string | null
          total_requests: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          game_id: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          permissions?: Json | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          revoked_reason?: string | null
          total_requests?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          game_id?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          permissions?: Json | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          revoked_reason?: string | null
          total_requests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sdk_api_keys_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      sdk_nonces: {
        Row: {
          created_at: string
          device_id: string
          expires_at: string
          nonce: string
        }
        Insert: {
          created_at?: string
          device_id: string
          expires_at: string
          nonce: string
        }
        Update: {
          created_at?: string
          device_id?: string
          expires_at?: string
          nonce?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdk_nonces_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_milestones: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          major_number: number
          metadata: Json | null
          milestone_id: string
          minor_number: number
          notes: string | null
          position: number | null
          priority: string | null
          progress_percentage: number | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          major_number: number
          metadata?: Json | null
          milestone_id: string
          minor_number: number
          notes?: string | null
          position?: number | null
          priority?: string | null
          progress_percentage?: number | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          major_number?: number
          metadata?: Json | null
          milestone_id?: string
          minor_number?: number
          notes?: string | null
          position?: number | null
          priority?: string | null
          progress_percentage?: number | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_milestones_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          admin_user_id: string | null
          created_at: string | null
          field_changed: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          task_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          admin_user_id?: string | null
          created_at?: string | null
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          task_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          admin_user_id?: string | null
          created_at?: string | null
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          created_at: string | null
          task_id: string
          team_member_id: string
        }
        Insert: {
          created_at?: string | null
          task_id: string
          team_member_id: string
        }
        Update: {
          created_at?: string | null
          task_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_label_assignments: {
        Row: {
          created_at: string | null
          label_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          label_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          label_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "task_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_label_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_labels: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          color: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_milestone: boolean | null
          parent_task_id: string | null
          position: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_milestone?: boolean | null
          parent_task_id?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_milestone?: boolean | null
          parent_task_id?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          admin_user_id: string | null
          avatar_url: string | null
          color: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          avatar_url?: string | null
          color?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          avatar_url?: string | null
          color?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          balance_after_cents: number
          created_at: string | null
          description: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          player_id: string
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount_cents: number
          balance_after_cents: number
          created_at?: string | null
          description?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          player_id: string
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount_cents?: number
          balance_after_cents?: number
          created_at?: string | null
          description?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          player_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          device_type: string | null
          id: string
          last_used_at: string
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_fraud_score: { Args: { p_player_id: string }; Returns: number }
      cleanup_expired_nonces: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: number }
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_priority?: Database["public"]["Enums"]["notification_priority"]
          p_recipient_id: string
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_sender_id: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: string
      }
      delete_audit_logs_before: {
        Args: { delete_before_date: string }
        Returns: {
          deleted_count: number
        }[]
      }
      generate_referral_code: { Args: never; Returns: string }
      get_game_config: {
        Args: { p_game_key: string }
        Returns: {
          bundle_id: string
          game_key: string
          id: string
          is_active: boolean
          max_daily_rewards_cents: number
          min_ad_interval_seconds: number
          name: string
          revenue_share_bps: number
          sdk_secret_hash: string
        }[]
      }
      get_or_create_dm_conversation: {
        Args: { p_user1_id: string; p_user2_id: string }
        Returns: string
      }
      get_player_daily_stats: {
        Args: { p_player_id: string }
        Returns: {
          ads_watched_today: number
          earnings_today_cents: number
          play_time_today_seconds: number
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      increment_game_players: {
        Args: { p_game_id: string; p_player_id: string }
        Returns: undefined
      }
      increment_game_sessions: { Args: { game_id: string }; Returns: undefined }
      mark_notifications_read: {
        Args: { p_notification_ids?: string[]; p_user_id: string }
        Returns: number
      }
      process_transaction: {
        Args: {
          p_amount_cents: number
          p_description?: string
          p_idempotency_key?: string
          p_player_id: string
          p_reference_id?: string
          p_reference_type?: string
          p_type: Database["public"]["Enums"]["transaction_type"]
        }
        Returns: {
          amount_cents: number
          balance_after_cents: number
          created_at: string | null
          description: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          player_id: string
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sdk_end_session: {
        Args: {
          p_ads_watched?: number
          p_device_id: string
          p_levels_completed?: number
          p_nonce?: string
          p_session_id: string
          p_signature?: string
          p_timestamp?: number
        }
        Returns: Json
      }
      sdk_heartbeat: {
        Args: { p_device_id: string; p_session_id: string }
        Returns: Json
      }
      sdk_register_install: {
        Args: {
          p_api_key: string
          p_device_fingerprint: string
          p_device_manufacturer?: string
          p_device_model?: string
          p_device_profile?: Json
          p_game_key: string
          p_install_id: string
          p_os_version?: string
          p_platform: string
          p_sdk_version?: string
        }
        Returns: Json
      }
      sdk_start_session: {
        Args: {
          p_device_id: string
          p_game_id: string
          p_nonce?: string
          p_sdk_version?: string
          p_signature?: string
          p_timestamp?: number
        }
        Returns: Json
      }
      sdk_track_ad_event: {
        Args: {
          p_ad_network: string
          p_ad_type: string
          p_ad_unit_id?: string
          p_currency?: string
          p_device_id: string
          p_game_id: string
          p_nonce?: string
          p_placement_id?: string
          p_revenue_microcents?: number
          p_session_id: string
          p_signature?: string
          p_timestamp?: number
          p_was_clicked?: boolean
          p_was_completed?: boolean
          p_watch_duration_ms?: number
        }
        Returns: Json
      }
    }
    Enums: {
      ad_network: "unity_ads" | "admob" | "ironsource" | "applovin" | "meta"
      ad_type: "rewarded" | "interstitial" | "banner"
      admin_role_type: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "VIEWER"
      delivery_status: "pending" | "delivered" | "failed" | "skipped"
      device_trust_level: "new" | "trusted" | "suspicious" | "blocked"
      fraud_flag_type:
        | "device_spoofing"
        | "multi_account"
        | "emulator_detected"
        | "time_manipulation"
        | "bot_behavior"
        | "api_abuse"
        | "velocity_abuse"
        | "referral_fraud"
      notification_priority: "low" | "normal" | "high" | "urgent"
      notification_type:
        | "direct_message"
        | "mention"
        | "task_assigned"
        | "task_updated"
        | "task_completed"
        | "system_alert"
        | "announcement"
        | "reminder"
        | "approval_request"
        | "approval_response"
      payout_method: "paypal" | "bitcoin" | "ethereum" | "usdc"
      payout_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      permission_category:
        | "USER_MANAGEMENT"
        | "CONTENT_MANAGEMENT"
        | "SYSTEM_SETTINGS"
        | "ANALYTICS"
        | "SECURITY"
        | "API_ACCESS"
      player_status: "active" | "suspended" | "banned" | "pending_verification"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done"
      transaction_type:
        | "ad_reward"
        | "referral_bonus"
        | "achievement_bonus"
        | "payout_request"
        | "payout_completed"
        | "payout_failed"
        | "adjustment"
        | "penalty"
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
      ad_network: ["unity_ads", "admob", "ironsource", "applovin", "meta"],
      ad_type: ["rewarded", "interstitial", "banner"],
      admin_role_type: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "VIEWER"],
      delivery_status: ["pending", "delivered", "failed", "skipped"],
      device_trust_level: ["new", "trusted", "suspicious", "blocked"],
      fraud_flag_type: [
        "device_spoofing",
        "multi_account",
        "emulator_detected",
        "time_manipulation",
        "bot_behavior",
        "api_abuse",
        "velocity_abuse",
        "referral_fraud",
      ],
      notification_priority: ["low", "normal", "high", "urgent"],
      notification_type: [
        "direct_message",
        "mention",
        "task_assigned",
        "task_updated",
        "task_completed",
        "system_alert",
        "announcement",
        "reminder",
        "approval_request",
        "approval_response",
      ],
      payout_method: ["paypal", "bitcoin", "ethereum", "usdc"],
      payout_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      permission_category: [
        "USER_MANAGEMENT",
        "CONTENT_MANAGEMENT",
        "SYSTEM_SETTINGS",
        "ANALYTICS",
        "SECURITY",
        "API_ACCESS",
      ],
      player_status: ["active", "suspended", "banned", "pending_verification"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done"],
      transaction_type: [
        "ad_reward",
        "referral_bonus",
        "achievement_bonus",
        "payout_request",
        "payout_completed",
        "payout_failed",
        "adjustment",
        "penalty",
      ],
    },
  },
} as const
