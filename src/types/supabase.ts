export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number
          location: string
          type: 'sale' | 'rent'
          bedrooms: number
          bathrooms: number
          area: number
          is_featured: boolean
          broker_phone: string | null
          broker_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price: number
          location: string
          type: 'sale' | 'rent'
          bedrooms: number
          bathrooms: number
          area: number
          is_featured?: boolean
          broker_phone?: string | null
          broker_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number
          location?: string
          type?: 'sale' | 'rent'
          bedrooms?: number
          bathrooms?: number
          area?: number
          is_featured?: boolean
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
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          image_url?: string
          created_at?: string
        }
      }
    }
  }
}