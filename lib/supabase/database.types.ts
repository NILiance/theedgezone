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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          ip: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          ip?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          ip?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      brand_assets: {
        Row: {
          asset_type: string
          background: string | null
          brand_design_id: string
          created_at: string
          drive_file_id: string | null
          id: string
          metadata: Json | null
          size_px: number | null
          url: string
        }
        Insert: {
          asset_type: string
          background?: string | null
          brand_design_id: string
          created_at?: string
          drive_file_id?: string | null
          id?: string
          metadata?: Json | null
          size_px?: number | null
          url: string
        }
        Update: {
          asset_type?: string
          background?: string | null
          brand_design_id?: string
          created_at?: string
          drive_file_id?: string | null
          id?: string
          metadata?: Json | null
          size_px?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_brand_design_id_fkey"
            columns: ["brand_design_id"]
            isOneToOne: false
            referencedRelation: "brand_designs"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_designs: {
        Row: {
          active_logo_id: string | null
          asset_credits_total: number
          asset_credits_used: number
          athletic_position: string | null
          brand_name: string | null
          brand_tone: string | null
          conference: string | null
          created_at: string
          id: string
          jersey_number: string | null
          logo_concept_credits: number
          mascot: string | null
          order_id: string | null
          primary_color: string | null
          school: string | null
          secondary_color: string | null
          sport: string | null
          status: string
          style_seed: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_logo_id?: string | null
          asset_credits_total?: number
          asset_credits_used?: number
          athletic_position?: string | null
          brand_name?: string | null
          brand_tone?: string | null
          conference?: string | null
          created_at?: string
          id?: string
          jersey_number?: string | null
          logo_concept_credits?: number
          mascot?: string | null
          order_id?: string | null
          primary_color?: string | null
          school?: string | null
          secondary_color?: string | null
          sport?: string | null
          status?: string
          style_seed?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_logo_id?: string | null
          asset_credits_total?: number
          asset_credits_used?: number
          athletic_position?: string | null
          brand_name?: string | null
          brand_tone?: string | null
          conference?: string | null
          created_at?: string
          id?: string
          jersey_number?: string | null
          logo_concept_credits?: number
          mascot?: string | null
          order_id?: string | null
          primary_color?: string | null
          school?: string | null
          secondary_color?: string | null
          sport?: string | null
          status?: string
          style_seed?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_designs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_settings: {
        Row: {
          id: number
          logo_height_footer: number
          logo_height_nav: number
          tagline: string
          updated_at: string
        }
        Insert: {
          id?: number
          logo_height_footer?: number
          logo_height_nav?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          id?: number
          logo_height_footer?: number
          logo_height_nav?: number
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_domains: {
        Row: {
          cert_status: string
          created_at: string
          domain: string
          target_slug: string
          target_type: Database["public"]["Enums"]["domain_target"]
          updated_at: string
          user_id: string | null
          vercel_domain_id: string | null
          verified_at: string | null
        }
        Insert: {
          cert_status?: string
          created_at?: string
          domain: string
          target_slug: string
          target_type: Database["public"]["Enums"]["domain_target"]
          updated_at?: string
          user_id?: string | null
          vercel_domain_id?: string | null
          verified_at?: string | null
        }
        Update: {
          cert_status?: string
          created_at?: string
          domain?: string
          target_slug?: string
          target_type?: Database["public"]["Enums"]["domain_target"]
          updated_at?: string
          user_id?: string | null
          vercel_domain_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      email_log: {
        Row: {
          bounced_at: string | null
          created_at: string
          delivered_at: string | null
          error: string | null
          from_address: string
          id: string
          metadata: Json | null
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_key: string | null
          to_address: string
        }
        Insert: {
          bounced_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          from_address: string
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_key?: string | null
          to_address: string
        }
        Update: {
          bounced_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error?: string | null
          from_address?: string
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string | null
          to_address?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          rollout_percentage: number
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          rollout_percentage?: number
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          rollout_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      logo_concepts: {
        Row: {
          brand_design_id: string
          created_at: string
          id: string
          image_url: string
          is_selected: boolean
          is_shortlisted: boolean
          metadata: Json | null
          parent_concept_id: string | null
          prompt: string | null
          provider: string
          round: number
          thumbnail_url: string | null
        }
        Insert: {
          brand_design_id: string
          created_at?: string
          id?: string
          image_url: string
          is_selected?: boolean
          is_shortlisted?: boolean
          metadata?: Json | null
          parent_concept_id?: string | null
          prompt?: string | null
          provider?: string
          round: number
          thumbnail_url?: string | null
        }
        Update: {
          brand_design_id?: string
          created_at?: string
          id?: string
          image_url?: string
          is_selected?: boolean
          is_shortlisted?: boolean
          metadata?: Json | null
          parent_concept_id?: string | null
          prompt?: string | null
          provider?: string
          round?: number
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logo_concepts_brand_design_id_fkey"
            columns: ["brand_design_id"]
            isOneToOne: false
            referencedRelation: "brand_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logo_concepts_parent_concept_id_fkey"
            columns: ["parent_concept_id"]
            isOneToOne: false
            referencedRelation: "logo_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      niliance_sync_events: {
        Row: {
          created_at: string
          direction: string
          id: number
          level: string
          message: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          id?: number
          level: string
          message: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          id?: number
          level?: string
          message?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number | null
          created_at: string
          crm_synced_at: string | null
          currency: string
          id: string
          plan: string | null
          product_slug: string
          product_title: string
          provisioned_at: string | null
          provisioned_entity_id: string | null
          purchased_at: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          crm_synced_at?: string | null
          currency?: string
          id?: string
          plan?: string | null
          product_slug: string
          product_title: string
          provisioned_at?: string | null
          provisioned_entity_id?: string | null
          purchased_at?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          crm_synced_at?: string | null
          currency?: string
          id?: string
          plan?: string | null
          product_slug?: string
          product_title?: string
          provisioned_at?: string | null
          provisioned_entity_id?: string | null
          purchased_at?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievements: string | null
          agency_name: string | null
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          athletic_position: string | null
          avatar_url: string | null
          bio: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          brand_tagline: string | null
          brand_voice: string | null
          city: string | null
          conference: string | null
          created_at: string
          crm_contact_id: string | null
          date_of_birth: string | null
          display_name: string | null
          division: string | null
          height_inches: number | null
          hometown: string | null
          id: string
          jersey_number: string | null
          metadata: Json
          nil_readiness_score: number | null
          niliance_banner_dismissed_at: string | null
          niliance_last_attempt_at: string | null
          niliance_link_error: string | null
          niliance_link_status: string
          niliance_listing_id: string | null
          niliance_synced_at: string | null
          niliance_user_id: string | null
          phone: string | null
          points: number
          profile_completion_pct: number | null
          school: string | null
          selected_goals: string[]
          socials: Json
          sport: string | null
          street_address: string | null
          updated_at: string
          us_state: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          website_url: string | null
          weight_lbs: number | null
        }
        Insert: {
          achievements?: string | null
          agency_name?: string | null
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          athletic_position?: string | null
          avatar_url?: string | null
          bio?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          brand_tagline?: string | null
          brand_voice?: string | null
          city?: string | null
          conference?: string | null
          created_at?: string
          crm_contact_id?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          division?: string | null
          height_inches?: number | null
          hometown?: string | null
          id: string
          jersey_number?: string | null
          metadata?: Json
          nil_readiness_score?: number | null
          niliance_banner_dismissed_at?: string | null
          niliance_last_attempt_at?: string | null
          niliance_link_error?: string | null
          niliance_link_status?: string
          niliance_listing_id?: string | null
          niliance_synced_at?: string | null
          niliance_user_id?: string | null
          phone?: string | null
          points?: number
          profile_completion_pct?: number | null
          school?: string | null
          selected_goals?: string[]
          socials?: Json
          sport?: string | null
          street_address?: string | null
          updated_at?: string
          us_state?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          website_url?: string | null
          weight_lbs?: number | null
        }
        Update: {
          achievements?: string | null
          agency_name?: string | null
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          athletic_position?: string | null
          avatar_url?: string | null
          bio?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          brand_tagline?: string | null
          brand_voice?: string | null
          city?: string | null
          conference?: string | null
          created_at?: string
          crm_contact_id?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          division?: string | null
          height_inches?: number | null
          hometown?: string | null
          id?: string
          jersey_number?: string | null
          metadata?: Json
          nil_readiness_score?: number | null
          niliance_banner_dismissed_at?: string | null
          niliance_last_attempt_at?: string | null
          niliance_link_error?: string | null
          niliance_link_status?: string
          niliance_listing_id?: string | null
          niliance_synced_at?: string | null
          niliance_user_id?: string | null
          phone?: string | null
          points?: number
          profile_completion_pct?: number | null
          school?: string | null
          selected_goals?: string[]
          socials?: Json
          sport?: string | null
          street_address?: string | null
          updated_at?: string
          us_state?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          website_url?: string | null
          weight_lbs?: number | null
        }
        Relationships: []
      }
      site_blocks: {
        Row: {
          block_type: string
          created_at: string
          id: string
          page_id: string
          position: number
          props: Json
          updated_at: string
        }
        Insert: {
          block_type: string
          created_at?: string
          id?: string
          page_id: string
          position?: number
          props?: Json
          updated_at?: string
        }
        Update: {
          block_type?: string
          created_at?: string
          id?: string
          page_id?: string
          position?: number
          props?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          created_at: string
          id: string
          meta: Json
          path: string
          position: number
          site_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json
          path: string
          position?: number
          site_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json
          path?: string
          position?: number
          site_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          default_meta: Json
          display_name: string | null
          id: string
          order_id: string | null
          published_at: string | null
          slug: string
          status: string
          tagline: string | null
          theme: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_meta?: Json
          display_name?: string | null
          id?: string
          order_id?: string | null
          published_at?: string | null
          slug: string
          status?: string
          tagline?: string | null
          theme?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_meta?: Json
          display_name?: string | null
          id?: string
          order_id?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          tagline?: string | null
          theme?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          received_at: string
          type: string
        }
        Insert: {
          id: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
          type: string
        }
        Update: {
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
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
      compute_profile_completion: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "athlete" | "vendor" | "admin" | "climb_admin"
      domain_target: "site" | "epk" | "podcast" | "store" | "app"
      user_type:
        | "talent"
        | "brand"
        | "agency"
        | "school"
        | "parent"
        | "fan"
        | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["athlete", "vendor", "admin", "climb_admin"],
      domain_target: ["site", "epk", "podcast", "store", "app"],
      user_type: [
        "talent",
        "brand",
        "agency",
        "school",
        "parent",
        "fan",
        "staff",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
