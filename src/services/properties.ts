import { supabase } from '../lib/supabase';
import { storageService } from './storage';
import type { Property } from '../types/property';

/**
 * Serviços de Propriedades
 * Responsável por todas as operações relacionadas às propriedades imobiliárias
 */

export const propertiesService = {
  /**
   * Buscar propriedades em destaque
   */
  async getFeaturedProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (
          image_url
        ),
        property_features (
          has_pool,
          has_garden,
          has_garage,
          has_security_system,
          has_air_conditioning,
          has_premium_appliances
        )
      `)
      .eq('is_featured', true);

    if (error) throw error;
    
    return this.formatPropertiesData(data);
  },

  /**
   * Buscar todas as propriedades
   */
  async getProperties(isAdminDashboard = false): Promise<Property[]> {
    if (isAdminDashboard) {
      return this.getPropertiesForAdmin();
    }

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (
          image_url
        ),
        property_features (
          has_pool,
          has_garden,
          has_garage,
          has_security_system,
          has_air_conditioning,
          has_premium_appliances
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return this.formatPropertiesData(data);
  },

  /**
   * Buscar propriedades para o dashboard admin
   */
  async getPropertiesForAdmin(): Promise<Property[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: userData } = await supabase.auth.getUser();
    const userRole = userData?.user?.user_metadata?.role || 'standard';

    const query = supabase
      .from('properties')
      .select(`
        *,
        property_images (
          image_url
        ),
        property_features (
          has_pool,
          has_garden,
          has_garage,
          has_security_system,
          has_air_conditioning,
          has_premium_appliances
        )
      `)
      .order('created_at', { ascending: false });

    if (userRole !== 'admin') {
      query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return this.formatPropertiesData(data);
  },

  /**
   * Buscar uma propriedade por ID
   */
  async getProperty(id: string): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (
          image_url
        ),
        property_features (
          has_pool,
          has_garden,
          has_garage,
          has_security_system,
          has_air_conditioning,
          has_premium_appliances
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const formattedData = this.formatPropertiesData([data]);
    return formattedData[0];
  },

  /**
   * Criar nova propriedade
   */
  async createProperty(propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    // First create the property
    const { data: newProperty, error: propertyError } = await supabase
      .from('properties')
      .insert({
        title: propertyData.title,
        description: propertyData.description,
        price: propertyData.price,
        location: propertyData.location,
        type: propertyData.type,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        area: propertyData.area,
        is_featured: propertyData.isFeatured,
        cover_photo_index: propertyData.coverPhotoIndex || 0,
        broker_phone: propertyData.brokerPhone,
        broker_email: propertyData.brokerEmail,
        user_id: user.id
      })
      .select()
      .single();

    if (propertyError) throw propertyError;

    // Insert features
    const { data: featuresData, error: featuresError } = await supabase
      .from('property_features')
      .insert({
        property_id: newProperty.id,
        ...propertyData.features
      })
      .select()
      .single();

    if (featuresError) throw featuresError;

    // Insert images if any
    if (propertyData.images && propertyData.images.length > 0) {
      await this.insertPropertyImages(newProperty.id, propertyData.images);
    }

    return {
      ...newProperty,
      images: propertyData.images || [],
      features: featuresData,
      isFeatured: newProperty.is_featured,
      coverPhotoIndex: newProperty.cover_photo_index || 0,
      brokerPhone: newProperty.broker_phone || undefined,
      brokerEmail: newProperty.broker_email || undefined
    };
  },

  /**
   * Atualizar propriedade
   */
  async updateProperty(id: string, propertyData: Partial<Property>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update main property data
    const updateData: any = {};
    if (propertyData.title !== undefined) updateData.title = propertyData.title;
    if (propertyData.description !== undefined) updateData.description = propertyData.description;
    if (propertyData.price !== undefined) updateData.price = propertyData.price;
    if (propertyData.location !== undefined) updateData.location = propertyData.location;
    if (propertyData.type !== undefined) updateData.type = propertyData.type;
    if (propertyData.bedrooms !== undefined) updateData.bedrooms = propertyData.bedrooms;
    if (propertyData.bathrooms !== undefined) updateData.bathrooms = propertyData.bathrooms;
    if (propertyData.area !== undefined) updateData.area = propertyData.area;
    if (propertyData.isFeatured !== undefined) updateData.is_featured = propertyData.isFeatured;
    if (propertyData.coverPhotoIndex !== undefined) updateData.cover_photo_index = propertyData.coverPhotoIndex;
    if (propertyData.brokerPhone !== undefined) updateData.broker_phone = propertyData.brokerPhone;
    if (propertyData.brokerEmail !== undefined) updateData.broker_email = propertyData.brokerEmail;

    if (Object.keys(updateData).length > 0) {
      const { error: propertyError } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id);

      if (propertyError) throw propertyError;
    }

    // Update features if provided
    if (propertyData.features) {
      await this.updatePropertyFeatures(id, propertyData.features);
    }

    // Update images if provided
    if (propertyData.images !== undefined) {
      await this.updatePropertyImages(id, propertyData.images);
    }
  },

  /**
   * Deletar propriedade
   */
  async deleteProperty(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get property images to delete from storage
    const { data: images } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('property_id', id);

    // Delete images from storage
    if (images && images.length > 0) {
      const imageUrls = images.map(img => img.image_url);
      await storageService.deleteMultipleImages(imageUrls);
    }

    // Delete property (cascade will handle related records)
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Formatar dados das propriedades
   */
  formatPropertiesData(data: any[]): Property[] {
    return data.map(property => ({
      ...property,
      images: property.property_images?.map((img: { image_url: string }) => img.image_url) || [],
      features: property.property_features?.[0] || {
        has_pool: false,
        has_garden: false,
        has_garage: false,
        has_security_system: false,
        has_air_conditioning: false,
        has_premium_appliances: false
      },
      isFeatured: property.is_featured,
      coverPhotoIndex: property.cover_photo_index || 0,
      brokerPhone: property.broker_phone || undefined,
      brokerEmail: property.broker_email || undefined
    }));
  },

  /**
   * Inserir imagens da propriedade
   */
  async insertPropertyImages(propertyId: string, images: string[]): Promise<void> {
    const imageInserts = images.map(image_url => ({
      property_id: propertyId,
      image_url
    }));

    const { error: imageError } = await supabase
      .from('property_images')
      .insert(imageInserts);

    if (imageError) throw imageError;
  },

  /**
   * Atualizar características da propriedade
   */
  async updatePropertyFeatures(propertyId: string, features: any): Promise<void> {
    const { error: featuresError } = await supabase
      .from('property_features')
      .upsert({ property_id: propertyId, ...features })
      .eq('property_id', propertyId);

    if (featuresError) throw featuresError;
  },

  /**
   * Atualizar imagens da propriedade
   */
  async updatePropertyImages(propertyId: string, newImages: string[]): Promise<void> {
    // Delete existing images
    const { error: deleteError } = await supabase
      .from('property_images')
      .delete()
      .eq('property_id', propertyId);

    if (deleteError) throw deleteError;

    // Insert new images
    if (newImages.length > 0) {
      await this.insertPropertyImages(propertyId, newImages);
    }
  }
}; 