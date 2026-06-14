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
      brand_client_assets: {
        Row: {
          brand_client_id: string
          created_at: string
          description: string | null
          filename: string
          id: string
          kind: string
          size_bytes: number | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          brand_client_id: string
          created_at?: string
          description?: string | null
          filename: string
          id?: string
          kind?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          brand_client_id?: string
          created_at?: string
          description?: string | null
          filename?: string
          id?: string
          kind?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_client_assets_brand_client_id_fkey"
            columns: ["brand_client_id"]
            isOneToOne: false
            referencedRelation: "brand_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_client_tokens: {
        Row: {
          brand_client_id: string
          consumed_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          token: string
        }
        Insert: {
          brand_client_id: string
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at: string
          token: string
        }
        Update: {
          brand_client_id?: string
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_client_tokens_brand_client_id_fkey"
            columns: ["brand_client_id"]
            isOneToOne: false
            referencedRelation: "brand_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_clients: {
        Row: {
          company: string | null
          contact_email: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          contact_email: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          contact_email?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_designs: {
        Row: {
          active_logo_id: string | null
          asset_credits_total: number
          asset_credits_used: number
          athletic_position: string | null
          brand_kit_assembled_at: string | null
          brand_kit_drive_id: string | null
          brand_kit_url: string | null
          brand_name: string | null
          brand_tone: string | null
          conference: string | null
          created_at: string
          final_logo_url: string | null
          finalized_at: string | null
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
          brand_kit_assembled_at?: string | null
          brand_kit_drive_id?: string | null
          brand_kit_url?: string | null
          brand_name?: string | null
          brand_tone?: string | null
          conference?: string | null
          created_at?: string
          final_logo_url?: string | null
          finalized_at?: string | null
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
          brand_kit_assembled_at?: string | null
          brand_kit_drive_id?: string | null
          brand_kit_url?: string | null
          brand_name?: string | null
          brand_tone?: string | null
          conference?: string | null
          created_at?: string
          final_logo_url?: string | null
          finalized_at?: string | null
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
      climb_milestones: {
        Row: {
          audience: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          duration_min: number | null
          hero_image_url: string | null
          id: string
          position: number
          published: boolean
          slides: Json
          slug: string
          summary: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audience?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          duration_min?: number | null
          hero_image_url?: string | null
          id?: string
          position?: number
          published?: boolean
          slides?: Json
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audience?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          duration_min?: number | null
          hero_image_url?: string | null
          id?: string
          position?: number
          published?: boolean
          slides?: Json
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
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
      enrollment_invitations: {
        Row: {
          converted_user_id: string | null
          display_name: string | null
          email: string
          enrolled_at: string
          enrolled_by: string | null
          failure_message: string | null
          id: string
          metadata: Json
          notes: string | null
          opened_at: string | null
          programs: string[]
          resend_id: string | null
          school: string | null
          sent_at: string | null
          sport: string | null
          status: string
        }
        Insert: {
          converted_user_id?: string | null
          display_name?: string | null
          email: string
          enrolled_at?: string
          enrolled_by?: string | null
          failure_message?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          opened_at?: string | null
          programs?: string[]
          resend_id?: string | null
          school?: string | null
          sent_at?: string | null
          sport?: string | null
          status?: string
        }
        Update: {
          converted_user_id?: string | null
          display_name?: string | null
          email?: string
          enrolled_at?: string
          enrolled_by?: string | null
          failure_message?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          opened_at?: string | null
          programs?: string[]
          resend_id?: string | null
          school?: string | null
          sent_at?: string | null
          sport?: string | null
          status?: string
        }
        Relationships: []
      }
      enrollment_template: {
        Row: {
          body: string
          id: number
          reply_to: string | null
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          id?: number
          reply_to?: string | null
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          id?: number
          reply_to?: string | null
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      epk_blocks: {
        Row: {
          block_type: string
          created_at: string
          epk_id: string
          id: string
          position: number
          props: Json
          updated_at: string
        }
        Insert: {
          block_type: string
          created_at?: string
          epk_id: string
          id?: string
          position?: number
          props?: Json
          updated_at?: string
        }
        Update: {
          block_type?: string
          created_at?: string
          epk_id?: string
          id?: string
          position?: number
          props?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epk_blocks_epk_id_fkey"
            columns: ["epk_id"]
            isOneToOne: false
            referencedRelation: "epks"
            referencedColumns: ["id"]
          },
        ]
      }
      epks: {
        Row: {
          created_at: string
          custom_domain: string | null
          default_meta: Json
          display_name: string | null
          footer: Json
          header: Json
          id: string
          layout: string | null
          onboarding_complete: boolean
          order_id: string | null
          published_at: string | null
          slug: string
          social: Json
          status: string
          tagline: string | null
          template_id: string | null
          theme: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          default_meta?: Json
          display_name?: string | null
          footer?: Json
          header?: Json
          id?: string
          layout?: string | null
          onboarding_complete?: boolean
          order_id?: string | null
          published_at?: string | null
          slug: string
          social?: Json
          status?: string
          tagline?: string | null
          template_id?: string | null
          theme?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          default_meta?: Json
          display_name?: string | null
          footer?: Json
          header?: Json
          id?: string
          layout?: string | null
          onboarding_complete?: boolean
          order_id?: string | null
          published_at?: string | null
          slug?: string
          social?: Json
          status?: string
          tagline?: string | null
          template_id?: string | null
          theme?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "epks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      niliance_poll_state: {
        Row: {
          id: number
          last_error: string | null
          last_opp_poll: string | null
          last_user_poll: string | null
          opp_cursor: string | null
          updated_at: string
          user_cursor: string | null
        }
        Insert: {
          id?: number
          last_error?: string | null
          last_opp_poll?: string | null
          last_user_poll?: string | null
          opp_cursor?: string | null
          updated_at?: string
          user_cursor?: string | null
        }
        Update: {
          id?: number
          last_error?: string | null
          last_opp_poll?: string | null
          last_user_poll?: string | null
          opp_cursor?: string | null
          updated_at?: string
          user_cursor?: string | null
        }
        Relationships: []
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
      opportunities: {
        Row: {
          audience: string
          cached_at: string
          category: string | null
          contact_email: string | null
          created_at: string
          currency: string
          deadline_at: string | null
          description: string
          external_url: string | null
          id: string
          listing_uuid: string | null
          location: string | null
          meta: Json
          posted_by: string | null
          posted_by_uuid: string | null
          price_cents: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          cached_at?: string
          category?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string
          deadline_at?: string | null
          description: string
          external_url?: string | null
          id?: string
          listing_uuid?: string | null
          location?: string | null
          meta?: Json
          posted_by?: string | null
          posted_by_uuid?: string | null
          price_cents?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          cached_at?: string
          category?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string
          deadline_at?: string | null
          description?: string
          external_url?: string | null
          id?: string
          listing_uuid?: string | null
          location?: string | null
          meta?: Json
          posted_by?: string | null
          posted_by_uuid?: string | null
          price_cents?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number | null
          created_at: string
          crm_synced_at: string | null
          currency: string
          fulfillment_notes: string | null
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
          fulfillment_notes?: string | null
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
          fulfillment_notes?: string | null
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
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean | null
          stripe_connect_details_submitted: boolean | null
          stripe_connect_onboarded_at: string | null
          stripe_connect_payouts_enabled: boolean | null
          stripe_connect_status: string | null
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
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_onboarded_at?: string | null
          stripe_connect_payouts_enabled?: boolean | null
          stripe_connect_status?: string | null
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
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_onboarded_at?: string | null
          stripe_connect_payouts_enabled?: boolean | null
          stripe_connect_status?: string | null
          updated_at?: string
          us_state?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          website_url?: string | null
          weight_lbs?: number | null
        }
        Relationships: []
      }
      resource_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          audience: string
          category_id: string | null
          created_at: string
          description: string | null
          download_count: number
          external_url: string | null
          featured: boolean
          file_url: string | null
          id: string
          position: number
          published: boolean
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          updated_by: string | null
          view_count: number
        }
        Insert: {
          audience?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          featured?: boolean
          file_url?: string | null
          id?: string
          position?: number
          published?: boolean
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Update: {
          audience?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          featured?: boolean
          file_url?: string | null
          id?: string
          position?: number
          published?: boolean
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          audience: string
          created_at: string
          description: string | null
          id: string
          name: string
          phase_id: string | null
          position: number
          published: boolean
          recommended_action_label: string | null
          recommended_action_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          audience?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          phase_id?: string | null
          position?: number
          published?: boolean
          recommended_action_label?: string | null
          recommended_action_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          audience?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          phase_id?: string | null
          position?: number
          published?: boolean
          recommended_action_label?: string | null
          recommended_action_url?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "roadmap_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_phases: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number
          published: boolean
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number
          published?: boolean
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number
          published?: boolean
          slug?: string
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          active: boolean
          custom_label: string | null
          plan_annual_cents: number | null
          plan_monthly_cents: number | null
          plan_onetime_cents: number | null
          service_slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          custom_label?: string | null
          plan_annual_cents?: number | null
          plan_monthly_cents?: number | null
          plan_onetime_cents?: number | null
          service_slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          custom_label?: string | null
          plan_annual_cents?: number | null
          plan_monthly_cents?: number | null
          plan_onetime_cents?: number | null
          service_slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_affiliate_tokens: {
        Row: {
          affiliate_id: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          affiliate_id: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          affiliate_id?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_affiliate_tokens_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "site_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      site_affiliates: {
        Row: {
          active: boolean
          clicks: number
          code: string
          created_at: string
          email: string | null
          id: string
          lifetime_revenue_cents: number
          name: string
          signups: number
          site_id: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          clicks?: number
          code: string
          created_at?: string
          email?: string | null
          id?: string
          lifetime_revenue_cents?: number
          name: string
          signups?: number
          site_id: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          clicks?: number
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          lifetime_revenue_cents?: number
          name?: string
          signups?: number
          site_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_affiliates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_assets: {
        Row: {
          created_at: string
          filename: string | null
          id: string
          mime_type: string | null
          path: string
          site_id: string | null
          size_bytes: number | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filename?: string | null
          id?: string
          mime_type?: string | null
          path: string
          site_id?: string | null
          size_bytes?: number | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          filename?: string | null
          id?: string
          mime_type?: string | null
          path?: string
          site_id?: string | null
          size_bytes?: number | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_assets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
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
      site_galleries: {
        Row: {
          created_at: string
          id: string
          images: Json
          name: string
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          images?: Json
          name: string
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          images?: Json
          name?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_galleries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_guestbook_entries: {
        Row: {
          approved: boolean
          block_id: string | null
          created_at: string
          display_name: string
          id: string
          message: string
          site_id: string
        }
        Insert: {
          approved?: boolean
          block_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          message: string
          site_id: string
        }
        Update: {
          approved?: boolean
          block_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          message?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_guestbook_entries_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "site_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_guestbook_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_membership_tiers: {
        Row: {
          active: boolean
          billing_interval: string
          created_at: string
          description: string | null
          id: string
          name: string
          perks: Json
          position: number
          price_cents: number
          site_id: string
          stripe_price_id: string | null
        }
        Insert: {
          active?: boolean
          billing_interval?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          perks?: Json
          position?: number
          price_cents?: number
          site_id: string
          stripe_price_id?: string | null
        }
        Update: {
          active?: boolean
          billing_interval?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          perks?: Json
          position?: number
          price_cents?: number
          site_id?: string
          stripe_price_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_membership_tiers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_page_views: {
        Row: {
          country: string | null
          created_at: string
          id: string
          ip_hash: string | null
          page_id: string | null
          path: string
          referrer: string | null
          site_id: string
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          page_id?: string | null
          path: string
          referrer?: string | null
          site_id: string
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          page_id?: string | null
          path?: string
          referrer?: string | null
          site_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_page_views_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_page_views_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          created_at: string
          early_access_hours: number
          id: string
          meta: Json
          nav_label: string | null
          nav_parent: string | null
          nav_visible: boolean
          page_type: string | null
          path: string
          position: number
          required_level: number
          seo: Json
          site_id: string
          status: string
          supporters_only: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          early_access_hours?: number
          id?: string
          meta?: Json
          nav_label?: string | null
          nav_parent?: string | null
          nav_visible?: boolean
          page_type?: string | null
          path: string
          position?: number
          required_level?: number
          seo?: Json
          site_id: string
          status?: string
          supporters_only?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          early_access_hours?: number
          id?: string
          meta?: Json
          nav_label?: string | null
          nav_parent?: string | null
          nav_visible?: boolean
          page_type?: string | null
          path?: string
          position?: number
          required_level?: number
          seo?: Json
          site_id?: string
          status?: string
          supporters_only?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_pages_nav_parent_fkey"
            columns: ["nav_parent"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_poll_votes: {
        Row: {
          block_id: string
          created_at: string
          id: string
          option_value: string
          site_id: string
          voter_token: string | null
          voter_user_id: string | null
        }
        Insert: {
          block_id: string
          created_at?: string
          id?: string
          option_value: string
          site_id: string
          voter_token?: string | null
          voter_user_id?: string | null
        }
        Update: {
          block_id?: string
          created_at?: string
          id?: string
          option_value?: string
          site_id?: string
          voter_token?: string | null
          voter_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_poll_votes_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "site_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_poll_votes_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_products: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          position: number
          price_cents: number
          site_id: string
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          position?: number
          price_cents?: number
          site_id: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          price_cents?: number
          site_id?: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_products_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_short_links: {
        Row: {
          clicks: number
          created_at: string
          id: string
          last_clicked_at: string | null
          site_id: string
          slug: string
          target_url: string
          title: string | null
        }
        Insert: {
          clicks?: number
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          site_id: string
          slug: string
          target_url: string
          title?: string | null
        }
        Update: {
          clicks?: number
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          site_id?: string
          slug?: string
          target_url?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_short_links_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_submissions: {
        Row: {
          block_id: string | null
          created_at: string
          id: string
          page_id: string | null
          payload: Json
          site_id: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          payload?: Json
          site_id: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          payload?: Json
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_submissions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "site_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_submissions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          site_id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          site_id: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          site_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_subscribers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_support_rewards: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          image_url: string | null
          name: string
          position: number
          required_tier_id: string | null
          reward_type: string
          site_id: string
          unlock_amount_cents: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          name: string
          position?: number
          required_tier_id?: string | null
          reward_type?: string
          site_id: string
          unlock_amount_cents?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          required_tier_id?: string | null
          reward_type?: string
          site_id?: string
          unlock_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_support_rewards_required_tier_id_fkey"
            columns: ["required_tier_id"]
            isOneToOne: false
            referencedRelation: "site_membership_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_support_rewards_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_tips: {
        Row: {
          amount_cents: number
          block_id: string | null
          created_at: string
          display_name: string | null
          id: string
          message: string | null
          site_id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_cents: number
          block_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          message?: string | null
          site_id: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          block_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          message?: string | null
          site_id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_tips_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "site_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_tips_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_transactions: {
        Row: {
          affiliate_code: string | null
          amount_cents: number
          block_id: string | null
          buyer_email: string | null
          buyer_name: string | null
          created_at: string
          currency: string
          id: string
          kind: string
          message: string | null
          metadata: Json
          paid_at: string | null
          product_id: string | null
          site_id: string
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          tier_id: string | null
        }
        Insert: {
          affiliate_code?: string | null
          amount_cents?: number
          block_id?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          kind: string
          message?: string | null
          metadata?: Json
          paid_at?: string | null
          product_id?: string | null
          site_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
        }
        Update: {
          affiliate_code?: string | null
          amount_cents?: number
          block_id?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          message?: string | null
          metadata?: Json
          paid_at?: string | null
          product_id?: string | null
          site_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_transactions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "site_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "site_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_transactions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_transactions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "site_membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          custom_domain: string | null
          default_meta: Json
          display_name: string | null
          footer: Json
          header: Json
          id: string
          layout: string | null
          onboarding_complete: boolean
          order_id: string | null
          published_at: string | null
          slug: string
          social: Json
          status: string
          tagline: string | null
          template_id: string | null
          theme: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          default_meta?: Json
          display_name?: string | null
          footer?: Json
          header?: Json
          id?: string
          layout?: string | null
          onboarding_complete?: boolean
          order_id?: string | null
          published_at?: string | null
          slug: string
          social?: Json
          status?: string
          tagline?: string | null
          template_id?: string | null
          theme?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          default_meta?: Json
          display_name?: string | null
          footer?: Json
          header?: Json
          id?: string
          layout?: string | null
          onboarding_complete?: boolean
          order_id?: string | null
          published_at?: string | null
          slug?: string
          social?: Json
          status?: string
          tagline?: string | null
          template_id?: string | null
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
      store_orders: {
        Row: {
          amount_cents: number
          buyer_email: string | null
          buyer_name: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          paid_at: string | null
          product_id: string | null
          shipped_at: string | null
          shipping_address: Json | null
          status: string
          store_id: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          tracking_carrier: string | null
          tracking_number: string | null
          variant_sku: string | null
        }
        Insert: {
          amount_cents: number
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          product_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: string
          store_id: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          tracking_carrier?: string | null
          tracking_number?: string | null
          variant_sku?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          product_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: string
          store_id?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          tracking_carrier?: string | null
          tracking_number?: string | null
          variant_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          active: boolean
          compare_at_cents: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_urls: Json
          inventory: number | null
          name: string
          position: number
          price_cents: number
          primary_image_url: string | null
          slug: string
          store_id: string
          supplier: string | null
          supplier_payload: Json | null
          supplier_sku: string | null
          tags: string[]
          updated_at: string
          variants: Json
          weight_grams: number | null
        }
        Insert: {
          active?: boolean
          compare_at_cents?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_urls?: Json
          inventory?: number | null
          name: string
          position?: number
          price_cents?: number
          primary_image_url?: string | null
          slug: string
          store_id: string
          supplier?: string | null
          supplier_payload?: Json | null
          supplier_sku?: string | null
          tags?: string[]
          updated_at?: string
          variants?: Json
          weight_grams?: number | null
        }
        Update: {
          active?: boolean
          compare_at_cents?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_urls?: Json
          inventory?: number | null
          name?: string
          position?: number
          price_cents?: number
          primary_image_url?: string | null
          slug?: string
          store_id?: string
          supplier?: string | null
          supplier_payload?: Json | null
          supplier_sku?: string | null
          tags?: string[]
          updated_at?: string
          variants?: Json
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          commission_bps: number
          contact_email: string | null
          created_at: string
          custom_domain: string | null
          description: string | null
          hero_image_url: string | null
          id: string
          logo_url: string | null
          metadata: Json
          name: string
          order_id: string | null
          payout_currency: string
          primary_color: string
          secondary_color: string
          slug: string
          status: string
          tagline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_bps?: number
          contact_email?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          hero_image_url?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json
          name: string
          order_id?: string | null
          payout_currency?: string
          primary_color?: string
          secondary_color?: string
          slug: string
          status?: string
          tagline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_bps?: number
          contact_email?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          hero_image_url?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json
          name?: string
          order_id?: string | null
          payout_currency?: string
          primary_color?: string
          secondary_color?: string
          slug?: string
          status?: string
          tagline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_order_id_fkey"
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
      talent_apps: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          last_build_at: string | null
          name: string
          order_id: string | null
          package_id: string | null
          primary_color: string
          privacy_policy_url: string | null
          screens: Json
          secondary_color: string
          settings: Json
          slug: string
          splash_url: string | null
          status: string
          tagline: string | null
          theme_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          last_build_at?: string | null
          name: string
          order_id?: string | null
          package_id?: string | null
          primary_color?: string
          privacy_policy_url?: string | null
          screens?: Json
          secondary_color?: string
          settings?: Json
          slug: string
          splash_url?: string | null
          status?: string
          tagline?: string | null
          theme_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          last_build_at?: string | null
          name?: string
          order_id?: string | null
          package_id?: string | null
          primary_color?: string
          privacy_policy_url?: string | null
          screens?: Json
          secondary_color?: string
          settings?: Json
          slug?: string
          splash_url?: string | null
          status?: string
          tagline?: string | null
          theme_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_apps_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_payouts: {
        Row: {
          amount_cents: number
          arrival_date: string | null
          created_at: string
          currency: string
          failure_message: string | null
          id: string
          metadata: Json
          status: string
          stripe_account_id: string
          stripe_payout_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          arrival_date?: string | null
          created_at?: string
          currency?: string
          failure_message?: string | null
          id?: string
          metadata?: Json
          status?: string
          stripe_account_id: string
          stripe_payout_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          arrival_date?: string | null
          created_at?: string
          currency?: string
          failure_message?: string | null
          id?: string
          metadata?: Json
          status?: string
          stripe_account_id?: string
          stripe_payout_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          body: string
          category: string | null
          closed_at: string | null
          created_at: string
          id: string
          last_activity_at: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          category?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          category?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_climb_progress: {
        Row: {
          completed_at: string
          milestone_id: string
          notes: string | null
          user_id: string
          watched_seconds: number
        }
        Insert: {
          completed_at?: string
          milestone_id: string
          notes?: string | null
          user_id: string
          watched_seconds?: number
        }
        Update: {
          completed_at?: string
          milestone_id?: string
          notes?: string | null
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_climb_progress_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "climb_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roadmap_progress: {
        Row: {
          completed_at: string
          item_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          item_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          item_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roadmap_progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
        ]
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
      user_theme_presets: {
        Row: {
          created_at: string
          id: string
          name: string
          tokens: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tokens?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tokens?: Json
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
