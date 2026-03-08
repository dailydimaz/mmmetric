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
      alert_history: {
        Row: {
          alert_id: string
          channel: string
          comparison: string
          created_at: string
          id: string
          metric: string
          metric_value: number
          notification_sent: boolean | null
          site_id: string
          threshold: number
        }
        Insert: {
          alert_id: string
          channel: string
          comparison: string
          created_at?: string
          id?: string
          metric: string
          metric_value: number
          notification_sent?: boolean | null
          site_id: string
          threshold: number
        }
        Update: {
          alert_id?: string
          channel?: string
          comparison?: string
          created_at?: string
          id?: string
          metric?: string
          metric_value?: number
          notification_sent?: boolean | null
          site_id?: string
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          channel: Database["public"]["Enums"]["alert_channel"]
          channel_config: Json | null
          comparison: Database["public"]["Enums"]["alert_comparison"]
          created_at: string
          id: string
          is_enabled: boolean | null
          last_triggered_at: string | null
          metric: Database["public"]["Enums"]["alert_metric"]
          name: string
          site_id: string
          threshold: number
          type: Database["public"]["Enums"]["alert_type"]
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["alert_channel"]
          channel_config?: Json | null
          comparison: Database["public"]["Enums"]["alert_comparison"]
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_triggered_at?: string | null
          metric: Database["public"]["Enums"]["alert_metric"]
          name: string
          site_id: string
          threshold: number
          type: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["alert_channel"]
          channel_config?: Json | null
          comparison?: Database["public"]["Enums"]["alert_comparison"]
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_triggered_at?: string | null
          metric?: Database["public"]["Enums"]["alert_metric"]
          name?: string
          site_id?: string
          threshold?: number
          type?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_aggregation_watermark: {
        Row: {
          last_aggregated_at: string
          site_id: string
          updated_at: string
        }
        Insert: {
          last_aggregated_at?: string
          site_id: string
          updated_at?: string
        }
        Update: {
          last_aggregated_at?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_aggregation_watermark_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_devices_hourly: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          hour_timestamp: string
          id: string
          os: string | null
          site_id: string
          unique_visitors: number
          visits: number
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          hour_timestamp: string
          id?: string
          os?: string | null
          site_id: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          hour_timestamp?: string
          id?: string
          os?: string | null
          site_id?: string
          unique_visitors?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_devices_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_geo_hourly: {
        Row: {
          city: string | null
          country: string
          created_at: string
          hour_timestamp: string
          id: string
          site_id: string
          unique_visitors: number
          visits: number
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string
          hour_timestamp: string
          id?: string
          site_id: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          hour_timestamp?: string
          id?: string
          site_id?: string
          unique_visitors?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_geo_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_hourly: {
        Row: {
          bounces: number
          created_at: string
          hour_timestamp: string
          id: string
          pageviews: number
          sessions: number
          site_id: string
          total_session_duration: number
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          bounces?: number
          created_at?: string
          hour_timestamp: string
          id?: string
          pageviews?: number
          sessions?: number
          site_id: string
          total_session_duration?: number
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          bounces?: number
          created_at?: string
          hour_timestamp?: string
          id?: string
          pageviews?: number
          sessions?: number
          site_id?: string
          total_session_duration?: number
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_languages_hourly: {
        Row: {
          created_at: string
          hour_timestamp: string
          id: string
          language: string
          site_id: string
          unique_visitors: number
          visits: number
        }
        Insert: {
          created_at?: string
          hour_timestamp: string
          id?: string
          language: string
          site_id: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          created_at?: string
          hour_timestamp?: string
          id?: string
          language?: string
          site_id?: string
          unique_visitors?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_languages_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_pages_hourly: {
        Row: {
          created_at: string
          hour_timestamp: string
          id: string
          pageviews: number
          site_id: string
          unique_visitors: number
          url: string
        }
        Insert: {
          created_at?: string
          hour_timestamp: string
          id?: string
          pageviews?: number
          site_id: string
          unique_visitors?: number
          url: string
        }
        Update: {
          created_at?: string
          hour_timestamp?: string
          id?: string
          pageviews?: number
          site_id?: string
          unique_visitors?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_pages_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_referrers_hourly: {
        Row: {
          created_at: string
          hour_timestamp: string
          id: string
          referrer: string
          site_id: string
          unique_visitors: number
          visits: number
        }
        Insert: {
          created_at?: string
          hour_timestamp: string
          id?: string
          referrer: string
          site_id: string
          unique_visitors?: number
          visits?: number
        }
        Update: {
          created_at?: string
          hour_timestamp?: string
          id?: string
          referrer?: string
          site_id?: string
          unique_visitors?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_referrers_hourly_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      annotations: {
        Row: {
          annotation_date: string
          category: string
          color: string
          created_at: string
          description: string | null
          id: string
          site_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation_date: string
          category: string
          color: string
          created_at?: string
          description?: string | null
          id?: string
          site_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation_date?: string
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          site_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      city_coordinates: {
        Row: {
          city_name: string
          country_code: string
          latitude: number
          longitude: number
          updated_at: string
        }
        Insert: {
          city_name: string
          country_code: string
          latitude: number
          longitude: number
          updated_at?: string
        }
        Update: {
          city_name?: string
          country_code?: string
          latitude?: number
          longitude?: number
          updated_at?: string
        }
        Relationships: []
      }
      content_decay_monitors: {
        Row: {
          baseline_pageviews: number
          baseline_period_end: string | null
          baseline_period_start: string | null
          baseline_visitors: number
          comparison_period_days: number
          created_at: string
          current_decay_percent: number | null
          decay_threshold_percent: number
          id: string
          is_enabled: boolean
          last_alert_at: string | null
          last_checked_at: string | null
          site_id: string
          status: string | null
          updated_at: string
          url: string
        }
        Insert: {
          baseline_pageviews?: number
          baseline_period_end?: string | null
          baseline_period_start?: string | null
          baseline_visitors?: number
          comparison_period_days?: number
          created_at?: string
          current_decay_percent?: number | null
          decay_threshold_percent?: number
          id?: string
          is_enabled?: boolean
          last_alert_at?: string | null
          last_checked_at?: string | null
          site_id: string
          status?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          baseline_pageviews?: number
          baseline_period_end?: string | null
          baseline_period_start?: string | null
          baseline_visitors?: number
          comparison_period_days?: number
          created_at?: string
          current_decay_percent?: number | null
          decay_threshold_percent?: number
          id?: string
          is_enabled?: boolean
          last_alert_at?: string | null
          last_checked_at?: string | null
          site_id?: string
          status?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_decay_monitors_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_dashboards: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          layout: Json
          name: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          layout?: Json
          name: string
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          layout?: Json
          name?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_dashboards_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_integrations: {
        Row: {
          channel_name: string | null
          created_at: string
          id: string
          is_active: boolean
          notify_on: Json
          site_id: string
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notify_on?: Json
          site_id: string
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notify_on?: Json
          site_id?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      events_default: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_partitioned: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m01: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m02: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m03: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m04: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m05: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m06: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m07: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m08: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m09: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m10: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m11: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2025m12: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m01: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m02: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m03: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m04: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m05: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m06: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m07: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      events_y2026m08: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          hostname: string | null
          id: string
          language: string | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          site_id: string
          tag: string | null
          title: string | null
          url: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          hostname?: string | null
          id?: string
          language?: string | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          site_id?: string
          tag?: string | null
          title?: string | null
          url?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      experiment_assignments: {
        Row: {
          converted: boolean | null
          converted_at: string | null
          created_at: string
          experiment_id: string
          id: number
          variant_id: string
          visitor_id: string
        }
        Insert: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          experiment_id: string
          id?: never
          variant_id: string
          visitor_id: string
        }
        Update: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          experiment_id?: string
          id?: never
          variant_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_variants: {
        Row: {
          config: Json | null
          created_at: string
          experiment_id: string
          id: string
          is_control: boolean | null
          name: string
          weight: number
        }
        Insert: {
          config?: Json | null
          created_at?: string
          experiment_id: string
          id?: string
          is_control?: boolean | null
          name: string
          weight?: number
        }
        Update: {
          config?: Json | null
          created_at?: string
          experiment_id?: string
          id?: string
          is_control?: boolean | null
          name?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "experiment_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          goal_event: string
          goal_url: string | null
          id: string
          name: string
          site_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["experiment_status"]
          target_url: string
          traffic_percentage: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          goal_event?: string
          goal_url?: string | null
          id?: string
          name: string
          site_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          target_url: string
          traffic_percentage?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          goal_event?: string
          goal_url?: string | null
          id?: string
          name?: string
          site_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          target_url?: string
          traffic_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_events: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          event_name: string
          id: string
          payload: Json
          site_id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_name?: string
          id?: string
          payload: Json
          site_id: string
          source?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_name?: string
          id?: string
          payload?: Json
          site_id?: string
          source?: string | null
        }
        Relationships: []
      }
      funnels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          site_id: string
          steps: Json
          time_window_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          site_id: string
          steps?: Json
          time_window_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          site_id?: string
          steps?: Json
          time_window_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      geoip_blocks: {
        Row: {
          geoname_id: number | null
          network: unknown
        }
        Insert: {
          geoname_id?: number | null
          network: unknown
        }
        Update: {
          geoname_id?: number | null
          network?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "geoip_blocks_geoname_id_fkey"
            columns: ["geoname_id"]
            isOneToOne: false
            referencedRelation: "geoip_locations"
            referencedColumns: ["geoname_id"]
          },
        ]
      }
      geoip_locations: {
        Row: {
          city_name: string | null
          country_code: string
          country_name: string | null
          geoname_id: number
        }
        Insert: {
          city_name?: string | null
          country_code: string
          country_name?: string | null
          geoname_id: number
        }
        Update: {
          city_name?: string | null
          country_code?: string
          country_name?: string | null
          geoname_id?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          event_name: string
          id: string
          match_type: string
          name: string
          site_id: string
          updated_at: string
          url_match: string | null
        }
        Insert: {
          created_at?: string
          event_name?: string
          id?: string
          match_type?: string
          name: string
          site_id: string
          updated_at?: string
          url_match?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          match_type?: string
          name?: string
          site_id?: string
          updated_at?: string
          url_match?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_stats: {
        Row: {
          clicks: number
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number
          keyword: string
          position: number | null
          site_id: string
          url: string | null
        }
        Insert: {
          clicks?: number
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number
          keyword: string
          position?: number | null
          site_id: string
          url?: string | null
        }
        Update: {
          clicks?: number
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number
          keyword?: string
          position?: number | null
          site_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_stats_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      heatmap_clicks: {
        Row: {
          created_at: string
          element_selector: string | null
          element_text: string | null
          id: number
          session_id: string | null
          site_id: string
          url_path: string
          viewport_h: number
          viewport_w: number
          visitor_id: string | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          element_selector?: string | null
          element_text?: string | null
          id?: never
          session_id?: string | null
          site_id: string
          url_path: string
          viewport_h: number
          viewport_w: number
          visitor_id?: string | null
          x: number
          y: number
        }
        Update: {
          created_at?: string
          element_selector?: string | null
          element_text?: string | null
          id?: never
          session_id?: string | null
          site_id?: string
          url_path?: string
          viewport_h?: number
          viewport_w?: number
          visitor_id?: string | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "heatmap_clicks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      heatmap_scrolls: {
        Row: {
          created_at: string
          id: number
          max_scroll_percentage: number
          session_id: string | null
          site_id: string
          url_path: string
          viewport_h: number | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          max_scroll_percentage: number
          session_id?: string | null
          site_id: string
          url_path: string
          viewport_h?: number | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          max_scroll_percentage?: number
          session_id?: string | null
          site_id?: string
          url_path?: string
          viewport_h?: number | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "heatmap_scrolls_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_records: number | null
          file_name: string
          file_size: number
          id: string
          processed_records: number | null
          site_id: string
          started_at: string | null
          status: string
          total_records: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_records?: number | null
          file_name: string
          file_size?: number
          id?: string
          processed_records?: number | null
          site_id: string
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_records?: number | null
          file_name?: string
          file_size?: number
          id?: string
          processed_records?: number | null
          site_id?: string
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          created_at: string
          date_range: Json
          description: string | null
          filters: Json
          id: string
          is_public: boolean
          name: string
          share_token: string | null
          site_id: string
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          date_range?: Json
          description?: string | null
          filters?: Json
          id?: string
          is_public?: boolean
          name: string
          share_token?: string | null
          site_id: string
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          date_range?: Json
          description?: string | null
          filters?: Json
          id?: string
          is_public?: boolean
          name?: string
          share_token?: string | null
          site_id?: string
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "insights_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          metadata: Json | null
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          refresh_token?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          original_url: string
          site_id: string
          slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          original_url: string
          site_id: string
          slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          original_url?: string
          site_id?: string
          slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      log_imports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          rows_failed: number | null
          rows_processed: number | null
          site_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["log_import_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          rows_failed?: number | null
          rows_processed?: number | null
          site_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["log_import_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          rows_failed?: number | null
          rows_processed?: number | null
          site_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["log_import_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_imports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          os: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          email_notifications: boolean | null
          full_name: string | null
          has_completed_onboarding: boolean | null
          id: string
          marketing_emails: boolean | null
          updated_at: string
          weekly_digest: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          id: string
          marketing_emails?: boolean | null
          updated_at?: string
          weekly_digest?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          updated_at?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      public_dashboard_attempts: {
        Row: {
          attempts: number | null
          created_at: string
          id: string
          last_attempt: string | null
          locked_until: string | null
          share_token: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          id?: string
          last_attempt?: string | null
          locked_until?: string | null
          share_token: string
        }
        Update: {
          attempts?: number | null
          created_at?: string
          id?: string
          last_attempt?: string | null
          locked_until?: string | null
          share_token?: string
        }
        Relationships: []
      }
      public_dashboards: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          password_hash: string | null
          share_token: string
          show_devices: boolean
          show_geo: boolean
          show_pageviews: boolean
          show_referrers: boolean
          show_top_pages: boolean
          show_visitors: boolean
          site_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          password_hash?: string | null
          share_token?: string
          show_devices?: boolean
          show_geo?: boolean
          show_pageviews?: boolean
          show_referrers?: boolean
          show_top_pages?: boolean
          show_visitors?: boolean
          site_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          password_hash?: string | null
          share_token?: string
          show_devices?: boolean
          show_geo?: boolean
          show_pageviews?: boolean
          show_referrers?: boolean
          show_top_pages?: boolean
          show_visitors?: boolean
          site_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_dashboards_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_counters: {
        Row: {
          ip_hash: string
          request_count: number
          window_start: string
        }
        Insert: {
          ip_hash: string
          request_count?: number
          window_start?: string
        }
        Update: {
          ip_hash?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      segments: {
        Row: {
          created_at: string
          description: string | null
          filters: Json
          id: string
          is_default: boolean
          name: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          name: string
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          name?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      session_data: {
        Row: {
          created_at: string
          custom_id: string | null
          data: Json | null
          id: string
          session_id: string
          site_id: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          custom_id?: string | null
          data?: Json | null
          id?: string
          session_id: string
          site_id: string
          updated_at?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          custom_id?: string | null
          data?: Json | null
          id?: string
          session_id?: string
          site_id?: string
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_data_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      session_recordings: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          os: string | null
          page_count: number | null
          pages: string[] | null
          recording_size_bytes: number | null
          recording_url: string | null
          session_id: string
          site_id: string
          started_at: string
          status: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          os?: string | null
          page_count?: number | null
          pages?: string[] | null
          recording_size_bytes?: number | null
          recording_url?: string | null
          session_id: string
          site_id: string
          started_at?: string
          status?: string
          updated_at?: string
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          os?: string | null
          page_count?: number | null
          pages?: string[] | null
          recording_size_bytes?: number | null
          recording_url?: string | null
          session_id?: string
          site_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_recordings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          discount_codes: Json | null
          id: string
          line_items: Json | null
          order_created_at: string | null
          order_number: string | null
          shipping_total: number | null
          shopify_order_id: string
          site_id: string
          status: string
          tax_total: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          discount_codes?: Json | null
          id?: string
          line_items?: Json | null
          order_created_at?: string | null
          order_number?: string | null
          shipping_total?: number | null
          shopify_order_id: string
          site_id: string
          status?: string
          tax_total?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          discount_codes?: Json | null
          id?: string
          line_items?: Json | null
          order_created_at?: string | null
          order_number?: string | null
          shipping_total?: number | null
          shopify_order_id?: string
          site_id?: string
          status?: string
          tax_total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          site_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          site_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "site_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_group_members_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          brand_color: string | null
          brand_logo_url: string | null
          category: string | null
          created_at: string
          custom_css: string | null
          custom_domain: string | null
          domain: string | null
          id: string
          name: string
          remove_branding: boolean | null
          timezone: string | null
          tracking_id: string
          tracking_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_color?: string | null
          brand_logo_url?: string | null
          category?: string | null
          created_at?: string
          custom_css?: string | null
          custom_domain?: string | null
          domain?: string | null
          id?: string
          name: string
          remove_branding?: boolean | null
          timezone?: string | null
          tracking_id?: string
          tracking_tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_color?: string | null
          brand_logo_url?: string | null
          category?: string | null
          created_at?: string
          custom_css?: string | null
          custom_domain?: string | null
          domain?: string | null
          id?: string
          name?: string
          remove_branding?: boolean | null
          timezone?: string | null
          tracking_id?: string
          tracking_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      slack_integrations: {
        Row: {
          channel_name: string | null
          created_at: string
          id: string
          is_active: boolean
          notify_on: Json
          site_id: string
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notify_on?: Json
          site_id: string
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notify_on?: Json
          site_id?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          cert: string | null
          created_at: string
          domain: string
          entry_point: string | null
          id: string
          is_enabled: boolean | null
          issuer: string | null
          metadata_xml: string | null
          provider_type: string
          site_id: string
          updated_at: string
        }
        Insert: {
          cert?: string | null
          created_at?: string
          domain: string
          entry_point?: string | null
          id?: string
          is_enabled?: boolean | null
          issuer?: string | null
          metadata_xml?: string | null
          provider_type?: string
          site_id: string
          updated_at?: string
        }
        Update: {
          cert?: string | null
          created_at?: string
          domain?: string
          entry_point?: string | null
          id?: string
          is_enabled?: boolean | null
          issuer?: string | null
          metadata_xml?: string | null
          provider_type?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_providers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          load_priority: number | null
          name: string
          site_id: string
          trigger_rules: Json | null
          type: Database["public"]["Enums"]["tag_type"]
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          load_priority?: number | null
          name: string
          site_id: string
          trigger_rules?: Json | null
          type: Database["public"]["Enums"]["tag_type"]
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          load_priority?: number | null
          name?: string
          site_id?: string
          trigger_rules?: Json | null
          type?: Database["public"]["Enums"]["tag_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          site_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: string
          site_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          site_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          role: string
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          created_at: string
          events_count: number
          id: string
          month: string
          sites_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events_count?: number
          id?: string
          month: string
          sites_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          events_count?: number
          id?: string
          month?: string
          sites_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_profiles: {
        Row: {
          company: string | null
          created_at: string
          custom_properties: Json | null
          email: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          name: string | null
          site_id: string
          total_pageviews: number | null
          total_visits: number | null
          updated_at: string
          visitor_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          custom_properties?: Json | null
          email?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          name?: string | null
          site_id: string
          total_pageviews?: number | null
          total_visits?: number | null
          updated_at?: string
          visitor_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          custom_properties?: Json | null
          email?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          name?: string | null
          site_id?: string
          total_pageviews?: number | null
          total_visits?: number | null
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_profiles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      integrations_safe: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          provider: Database["public"]["Enums"]["integration_provider"] | null
          site_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["integration_provider"] | null
          site_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["integration_provider"] | null
          site_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      public_dashboards_safe: {
        Row: {
          created_at: string | null
          has_password: boolean | null
          id: string | null
          is_enabled: boolean | null
          share_token: string | null
          show_devices: boolean | null
          show_geo: boolean | null
          show_pageviews: boolean | null
          show_referrers: boolean | null
          show_top_pages: boolean | null
          show_visitors: boolean | null
          site_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          has_password?: never
          id?: string | null
          is_enabled?: boolean | null
          share_token?: string | null
          show_devices?: boolean | null
          show_geo?: boolean | null
          show_pageviews?: boolean | null
          show_referrers?: boolean | null
          show_top_pages?: boolean | null
          show_visitors?: boolean | null
          site_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          has_password?: never
          id?: string | null
          is_enabled?: boolean | null
          share_token?: string | null
          show_devices?: boolean | null
          show_geo?: boolean | null
          show_pageviews?: boolean | null
          show_referrers?: boolean | null
          show_top_pages?: boolean | null
          show_visitors?: boolean | null
          site_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_dashboards_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_analytics_data: {
        Args: { _batch_size?: number }
        Returns: {
          events_processed: number
          hours_aggregated: number
          sites_processed: number
        }[]
      }
      check_content_decay: {
        Args: { p_site_id: string }
        Returns: {
          baseline_pageviews: number
          current_pageviews: number
          decay_percent: number
          is_decaying: boolean
          monitor_id: string
          threshold_percent: number
          url: string
        }[]
      }
      check_rate_limit: {
        Args: { p_ip_hash: string; p_max_requests?: number }
        Returns: boolean
      }
      check_usage_limit: { Args: { p_site_id: string }; Returns: boolean }
      create_future_partitions: { Args: never; Returns: undefined }
      delete_expired_data: { Args: never; Returns: undefined }
      delete_expired_events: { Args: never; Returns: number }
      get_attribution_stats: {
        Args: {
          _attribution_model?: string
          _end_date: string
          _goal_event?: string
          _site_id: string
          _start_date: string
        }
        Returns: Json
      }
      get_browser_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          browser: string
          percentage: number
          visits: number
        }[]
      }
      get_city_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          city: string
          country: string
          latitude: number
          longitude: number
          percentage: number
          visits: number
        }[]
      }
      get_country_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          country: string
          percentage: number
          visits: number
        }[]
      }
      get_device_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _site_id: string
          _start_date: string
        }
        Returns: Json
      }
      get_engagement_stats: {
        Args: {
          _end_date: string
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          avg_duration: number
          total_duration: number
          url: string
          visits: number
        }[]
      }
      get_entry_exit_pages: {
        Args: {
          _end_date: string
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          entry_count: number
          exit_count: number
          url: string
        }[]
      }
      get_event_groups_stats: {
        Args: { _end_date: string; _site_id: string; _start_date: string }
        Returns: {
          event_count: number
          event_name: string
          last_occurrence: string
        }[]
      }
      get_experiment_stats: {
        Args: { _experiment_id: string }
        Returns: {
          conversion_rate: number
          conversions: number
          is_control: boolean
          uplift: number
          variant_id: string
          variant_name: string
          visitors: number
        }[]
      }
      get_file_download_stats: {
        Args: {
          _end_date: string
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          download_count: number
          extension: string
          filename: string
          href: string
        }[]
      }
      get_form_analytics_stats: {
        Args: { _end_date: string; _site_id: string; _start_date: string }
        Returns: {
          abandons: number
          conversion_rate: number
          form_id: string
          starts: number
          submissions: number
        }[]
      }
      get_funnel_stats: {
        Args: { _end_date: string; _funnel_id: string; _start_date: string }
        Returns: {
          conversion_rate: number
          drop_off_rate: number
          step_index: number
          step_name: string
          visitors: number
        }[]
      }
      get_geo_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          country: string
          percentage: number
          visits: number
        }[]
      }
      get_goal_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _site_id: string
          _start_date: string
        }
        Returns: {
          conversion_rate: number
          conversions: number
          goal_id: string
          name: string
          revenue: number
        }[]
      }
      get_language_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          language: string
          percentage: number
          visits: number
        }[]
      }
      get_os_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          os: string
          percentage: number
          visits: number
        }[]
      }
      get_overlay_stats: {
        Args: { _period?: string; _tracking_id: string; _url_path: string }
        Returns: {
          pageviews: number
          top_referrers: Json
          visitors: number
        }[]
      }
      get_public_dashboard_stats: {
        Args: {
          _end_date: string
          _password?: string
          _share_token: string
          _start_date: string
        }
        Returns: Json
      }
      get_realtime_stats: { Args: { _site_id: string }; Returns: Json }
      get_referrer_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          percentage: number
          referrer: string
          visits: number
        }[]
      }
      get_retention_cohorts: {
        Args: { _end_date: string; _site_id: string; _start_date: string }
        Returns: Json
      }
      get_retention_trend: {
        Args: { _end_date: string; _site_id: string; _start_date: string }
        Returns: {
          day: number
          rate: number
          retained: number
        }[]
      }
      get_scroll_depth_stats: {
        Args: {
          _end_date: string
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: Json
      }
      get_session_detail: {
        Args: { _session_id: string; _site_id: string }
        Returns: Json
      }
      get_sessions_list: {
        Args: {
          _end_date: string
          _filters?: Json
          _page?: number
          _per_page?: number
          _site_id: string
          _start_date: string
        }
        Returns: Json
      }
      get_shared_insight: {
        Args: { _share_token: string }
        Returns: {
          date_range: Json
          description: string
          filters: Json
          id: string
          name: string
          site_id: string
          widgets: Json
        }[]
      }
      get_shopify_orders_for_site: {
        Args: { p_site_id: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          customer_email: string
          discount_codes: Json
          id: string
          line_items: Json
          order_created_at: string
          order_number: string
          shipping_total: number
          shopify_order_id: string
          site_id: string
          status: string
          tax_total: number
          updated_at: string
        }[]
      }
      get_site_group_stats: {
        Args: {
          _end_date: string
          _group_id: string
          _prev_end_date?: string
          _prev_start_date?: string
          _start_date: string
        }
        Returns: Json
      }
      get_site_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _prev_end_date: string
          _prev_start_date: string
          _site_id: string
          _start_date: string
        }
        Returns: {
          avg_session_duration: number
          bounce_rate: number
          pageviews_change: number
          total_pageviews: number
          unique_visitors: number
          visitors_change: number
        }[]
      }
      get_team_member_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_timeseries_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _prev_end_date: string
          _prev_start_date: string
          _site_id: string
          _start_date: string
        }
        Returns: {
          date: string
          pageviews: number
          prev_pageviews: number
          prev_visitors: number
          visitors: number
        }[]
      }
      get_top_pages: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          pageviews: number
          unique_visitors: number
          url: string
        }[]
      }
      get_top_referrers: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          percentage: number
          referrer: string
          visits: number
        }[]
      }
      get_url_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: {
          pageviews: number
          unique_visitors: number
          url: string
        }[]
      }
      get_user_journeys: {
        Args: {
          _end_date: string
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: Json
      }
      get_utm_stats: {
        Args: {
          _end_date: string
          _filters?: Json
          _limit?: number
          _site_id: string
          _start_date: string
        }
        Returns: Json
      }
      has_team_role: {
        Args: { _min_role: string; _site_id: string }
        Returns: boolean
      }
      hash_password: { Args: { _password: string }; Returns: string }
      is_site_owner: { Args: { _site_id: string }; Returns: boolean }
      is_team_member_of_same_site: {
        Args: { _profile_user_id: string }
        Returns: boolean
      }
      lookup_geoip: {
        Args: { ip_address: string }
        Returns: {
          city: string
          country: string
          latitude: number
          longitude: number
        }[]
      }
      refresh_usage_records: { Args: never; Returns: undefined }
      setup_content_decay_monitors: {
        Args: {
          p_decay_threshold?: number
          p_site_id: string
          p_top_n?: number
        }
        Returns: number
      }
      verify_dashboard_password: {
        Args: { _password: string; _share_token: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_channel: "email" | "slack" | "webhook" | "discord"
      alert_comparison: "gt" | "lt"
      alert_metric: "visitors" | "pageviews" | "bounce_rate"
      alert_type: "traffic_spike" | "traffic_drop" | "uptime" | "content_decay"
      experiment_status: "draft" | "active" | "paused" | "ended"
      integration_provider:
        | "google_analytics"
        | "shopify"
        | "google_search_console"
      log_import_status: "pending" | "processing" | "completed" | "failed"
      tag_type:
        | "custom_html"
        | "google_analytics"
        | "facebook_pixel"
        | "google_tag_manager"
        | "custom_script"
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
      alert_channel: ["email", "slack", "webhook", "discord"],
      alert_comparison: ["gt", "lt"],
      alert_metric: ["visitors", "pageviews", "bounce_rate"],
      alert_type: ["traffic_spike", "traffic_drop", "uptime", "content_decay"],
      experiment_status: ["draft", "active", "paused", "ended"],
      integration_provider: [
        "google_analytics",
        "shopify",
        "google_search_console",
      ],
      log_import_status: ["pending", "processing", "completed", "failed"],
      tag_type: [
        "custom_html",
        "google_analytics",
        "facebook_pixel",
        "google_tag_manager",
        "custom_script",
      ],
    },
  },
} as const
