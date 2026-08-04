/**
 * Hand-authored Database types mirroring 02-database-schema.sql.
 * In a real project, regenerate after every migration with:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
 * Only the tables touched by Stage 2 (auth + admin) are typed in full here;
 * Stage 3 will extend this file for gallery/notifications tables.
 */

export type UserRole = 'user' | 'editor' | 'admin' | 'super_admin';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          role: UserRole;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      admin_accounts: {
        Row: {
          id: string;
          role: 'editor' | 'admin' | 'super_admin';
          granted_by: string | null;
          granted_at: string;
          revoked_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['admin_accounts']['Row']> & {
          id: string;
        };
        Update: Partial<Database['public']['Tables']['admin_accounts']['Row']>;
      };
      event_categories: {
        Row: { id: string; name: string; slug: string; icon: string | null };
        Insert: Partial<Database['public']['Tables']['event_categories']['Row']> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database['public']['Tables']['event_categories']['Row']>;
      };
      event_series: {
        Row: {
          id: string;
          title: string;
          category_id: string;
          recurrence_rule: { freq: 'weekly'; interval: number; byweekday: string[]; until?: string };
          default_start_time: string;
          default_end_time: string | null;
          active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['event_series']['Row']> & {
          title: string;
          category_id: string;
          recurrence_rule: Database['public']['Tables']['event_series']['Row']['recurrence_rule'];
          default_start_time: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['event_series']['Row']>;
      };
      events: {
        Row: {
          id: string;
          series_id: string | null;
          title: string;
          slug: string;
          description: string;
          category_id: string;
          genre: string | null;
          image_url: string | null;
          starts_at: string;
          ends_at: string | null;
          ticket_price: number | null;
          is_free_entry: boolean;
          is_featured: boolean;
          status: EventStatus;
          notify_subscribers: boolean;
          view_count: number;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['events']['Row']> & {
          title: string;
          slug: string;
          category_id: string;
          starts_at: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Row']>;
      };
      photos: {
        Row: {
          id: string;
          uploader_id: string;
          event_id: string | null;
          storage_path: string;
          thumbnail_path: string;
          caption: string | null;
          width: number | null;
          height: number | null;
          file_size_bytes: number | null;
          status: ModerationStatus;
          moderated_by: string | null;
          moderated_at: string | null;
          rejection_reason: string | null;
          uploaded_at: string;
        };
        Insert: Partial<Database['public']['Tables']['photos']['Row']> & {
          uploader_id: string;
          storage_path: string;
          thumbnail_path: string;
        };
        Update: Partial<Database['public']['Tables']['photos']['Row']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before: Record<string, unknown> | null;
          after: Record<string, unknown> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: never; // written only by DB trigger, never from app code
        Update: never;
      };
      photo_likes: {
        Row: { id: string; photo_id: string; user_id: string; created_at: string };
        Insert: { id?: string; photo_id: string; user_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['photo_likes']['Row']>;
      };
      photo_reports: {
        Row: {
          id: string;
          photo_id: string;
          reporter_id: string;
          reason: string;
          status: 'open' | 'reviewed' | 'dismissed';
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          photo_id: string;
          reporter_id: string;
          reason: string;
          status?: 'open' | 'reviewed' | 'dismissed';
        };
        Update: Partial<Database['public']['Tables']['photo_reports']['Row']>;
      };
      favourites: {
        Row: { id: string; user_id: string; event_id: string; created_at: string };
        Insert: { id?: string; user_id: string; event_id: string; created_at?: string };
        Update: never;
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth_key: string;
          user_agent: string | null;
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth_key: string;
          user_agent?: string | null;
        };
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Row']>;
      };
      notification_preferences: {
        Row: {
          user_id: string;
          push_enabled: boolean;
          email_enabled: boolean;
          frequency: 'immediate' | 'daily' | 'weekly' | 'off';
          notify_new_event: boolean;
          notify_event_changed: boolean;
          notify_cancelled: boolean;
          notify_featured: boolean;
          notify_weekly_reminder: boolean;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notification_preferences']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['notification_preferences']['Row']>;
      };
      venue_info: {
        Row: {
          id: boolean;
          name: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          postcode: string;
          phone: string;
          email: string | null;
          latitude: number | null;
          longitude: number | null;
          opening_hours: Record<string, { open: string; close: string }>;
          facebook_url: string | null;
          instagram_url: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['venue_info']['Row']>;
        Update: Partial<Database['public']['Tables']['venue_info']['Row']>;
      };
    };
  };
}
