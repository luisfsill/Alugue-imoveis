export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PropertyType = 'sale' | 'rent'
export type UserRole = 'admin' | 'standard'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          price: number
          location: string
          type: PropertyType
          bedrooms: number
          bathrooms: number
          area: number
          is_featured: boolean
          is_active: boolean
          cover_photo_index: number
          broker_phone: string | null
          broker_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          price: number
          location: string
          type: PropertyType
          bedrooms?: number
          bathrooms?: number
          area: number
          is_featured?: boolean
          is_active?: boolean
          cover_photo_index?: number
          broker_phone?: string | null
          broker_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          price?: number
          location?: string
          type?: PropertyType
          bedrooms?: number
          bathrooms?: number
          area?: number
          is_featured?: boolean
          is_active?: boolean
          cover_photo_index?: number
          broker_phone?: string | null
          broker_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      property_features: {
        Row: {
          id: string
          property_id: string
          has_pool: boolean
          has_garden: boolean
          has_garage: boolean
          has_security_system: boolean
          has_air_conditioning: boolean
          has_premium_appliances: boolean
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          has_pool?: boolean
          has_garden?: boolean
          has_garage?: boolean
          has_security_system?: boolean
          has_air_conditioning?: boolean
          has_premium_appliances?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          has_pool?: boolean
          has_garden?: boolean
          has_garage?: boolean
          has_security_system?: boolean
          has_air_conditioning?: boolean
          has_premium_appliances?: boolean
          created_at?: string
        }
      }
      property_images: {
        Row: {
          id: string
          property_id: string
          image_url: string
          processed_url: string | null
          alt_text: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          image_url: string
          processed_url?: string | null
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          image_url?: string
          processed_url?: string | null
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
      }
      property_views: {
        Row: {
          id: string
          property_id: string
          viewer_ip: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          property_id: string
          viewer_ip?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          viewer_ip?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          property_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          created_at?: string
        }
      }
      contact_requests: {
        Row: {
          id: string
          property_id: string
          name: string
          email: string
          phone: string | null
          message: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          name: string
          email: string
          phone?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          name?: string
          email?: string
          phone?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_property_details: {
        Args: {
          property_uuid: string
        }
        Returns: Json
      }
      search_properties: {
        Args: {
          search_query?: string
          property_type_filter?: PropertyType
          min_price?: number
          max_price?: number
          min_bedrooms?: number
          max_bedrooms?: number
          min_bathrooms?: number
          max_bathrooms?: number
          min_area?: number
          max_area?: number
          location_filter?: string
          featured_only?: boolean
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          price: number
          location: string
          type: PropertyType
          bedrooms: number
          bathrooms: number
          area: number
          is_featured: boolean
          cover_photo_index: number
          broker_phone: string | null
          broker_email: string | null
          created_at: string
          updated_at: string
          images: Json
          features: Json
        }[]
      }
      increment_property_views: {
        Args: {
          property_uuid: string
          viewer_ip_address?: string
          user_agent_string?: string
        }
        Returns: void
      }
      get_property_analytics: {
        Args: {
          property_uuid: string
        }
        Returns: Json
      }
    }
    Enums: {
      property_type: PropertyType
      user_role: UserRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 