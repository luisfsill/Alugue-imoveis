import { supabase } from '../lib/supabase';
import type { Property } from '../types/property';

interface PropertyImage {
  image_url: string;
}

// User Management Functions
export const updateUserEmail = async (userId: string, newEmail: string): Promise<void> => {
  const { error } = await supabase.rpc('update_user_email', {
    user_id: userId,
    new_email: newEmail
  });

  if (error) throw error;
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const { error } = await supabase.rpc('update_user_password', {
    user_id: userId,
    new_password: newPassword
  });

  if (error) throw error;
};

// Property Functions
export const getFeaturedProperties = async (): Promise<Property[]> => {
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
  
  return data.map(property => ({
    ...property,
    images: property.property_images?.map((img: PropertyImage) => img.image_url) || [],
    features: property.property_features?.[0] || {
      has_pool: false,
      has_garden: false,
      has_garage: false,
      has_security_system: false,
      has_air_conditioning: false,
      has_premium_appliances: false
    },
    isFeatured: property.is_featured,
    brokerPhone: property.broker_phone || undefined,
    brokerEmail: property.broker_email || undefined
  }));
};

export const createProperty = async (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
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
      broker_phone: propertyData.brokerPhone,
      broker_email: propertyData.brokerEmail,
      cover_photo_index: propertyData.coverPhotoIndex || 0,
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
    const imageInserts = propertyData.images.map(image_url => ({
      property_id: newProperty.id,
      image_url
    }));

    const { error: imageError } = await supabase
      .from('property_images')
      .insert(imageInserts);

    if (imageError) throw imageError;
  }

  return {
    ...newProperty,
    images: propertyData.images || [],
    features: featuresData,
    isFeatured: newProperty.is_featured,
    brokerPhone: newProperty.broker_phone || undefined,
    brokerEmail: newProperty.broker_email || undefined
  };
};

export const getProperties = async (isAdminDashboard = false): Promise<Property[]> => {
  // If we're in the admin dashboard, we need to check user role and filter accordingly
  if (isAdminDashboard) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user role
    const { data: userData } = await supabase.auth.getUser();
    const userRole = userData?.user?.user_metadata?.role || 'standard';

    // For standard users, only show their properties
    // For admins, show all properties
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

    return data.map(property => ({
      ...property,
      images: property.property_images?.map((img: PropertyImage) => img.image_url) || [],
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
  }

  // For public properties page, show all properties
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
  
  return data.map(property => ({
    ...property,
    images: property.property_images?.map((img: PropertyImage) => img.image_url) || [],
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
};

export const getProperty = async (id: string): Promise<Property> => {
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
  
  return {
    ...data,
    images: data.property_images?.map((img: PropertyImage) => img.image_url) || [],
    features: data.property_features?.[0] || {
      has_pool: false,
      has_garden: false,
      has_garage: false,
      has_security_system: false,
      has_air_conditioning: false,
      has_premium_appliances: false
    },
    isFeatured: data.is_featured,
    coverPhotoIndex: data.cover_photo_index || 0,
    brokerPhone: data.broker_phone || undefined,
    brokerEmail: data.broker_email || undefined
  };
};

export const updateProperty = async (id: string, propertyData: Partial<Property>): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get user role
  const { data: userData } = await supabase.auth.getUser();
  const userRole = userData?.user?.user_metadata?.role || 'standard';

  // Verify ownership or admin status and get current images
  const { data: existingProperty } = await supabase
    .from('properties')
    .select(`
      user_id,
      property_images (
        image_url
      )
    `)
    .eq('id', id)
    .single();

  if (!existingProperty || (existingProperty.user_id !== user.id && userRole !== 'admin')) {
    throw new Error('Unauthorized: You can only update your own properties');
  }

  const { error } = await supabase
    .from('properties')
    .update({
      title: propertyData.title,
      description: propertyData.description,
      price: propertyData.price,
      location: propertyData.location,
      type: propertyData.type,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      area: propertyData.area,
      is_featured: propertyData.isFeatured,
      broker_phone: propertyData.brokerPhone,
      broker_email: propertyData.brokerEmail,
      cover_photo_index: propertyData.coverPhotoIndex || 0
    })
    .eq('id', id);
  if (error) throw error;

  // Update features if provided
  const { error: deleteFeatureError } = await supabase
    .from('property_features')
    .delete()
    .eq('property_id', id);

  if (deleteFeatureError) throw deleteFeatureError;

  const { error: insertFeatureError } = await supabase
    .from('property_features')
    .insert({
      property_id: id,
      ...propertyData.features
    });

  if (insertFeatureError) {
    console.error('Erro ao atualizar características:', insertFeatureError);
    throw insertFeatureError;
  }

  // Update images if provided
  if (propertyData.images !== undefined) {
    // Get the current image URLs
    const currentImageUrls = existingProperty.property_images?.map(img => img.image_url) || [];
    const newImages = propertyData.images;
    
    // Find images that were removed
    const removedImages = currentImageUrls.filter(url => !newImages.includes(url));
    
    // Delete removed images from storage
    for (const imageUrl of removedImages) {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('property-images')
          .remove([fileName]);
        
        if (storageError) {
          console.error('Erro ao deletar imagem do storage:', storageError);
        }
      }
    }

    // Update database records
    const { error: deleteImageError } = await supabase
      .from('property_images')
      .delete()
      .eq('property_id', id);

    if (deleteImageError) throw deleteImageError;

    // Insert new image records
    if (newImages.length > 0) {
      const imageInserts = newImages.map(image_url => ({
        property_id: id,
        image_url
      }));
      const { error: insertImageError } = await supabase
        .from('property_images')
        .insert(imageInserts);

      if (insertImageError) throw insertImageError;
    }
  }
};

export const deleteProperty = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get user role
  const { data: userData } = await supabase.auth.getUser();
  const userRole = userData?.user?.user_metadata?.role || 'standard';

  // Verify ownership or admin status
  const { data: property } = await supabase
    .from('properties')
    .select(`
      user_id,
      property_images (
        image_url
      )
    `)
    .eq('id', id)
    .single();

  if (!property || (property.user_id !== user.id && userRole !== 'admin')) {
    throw new Error('Unauthorized: You can only delete your own properties');
  }

  // Delete images from storage
  if (property.property_images) {
    for (const image of property.property_images) {
      const fileName = image.image_url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('property-images')
          .remove([fileName]);
        
        if (storageError) {
          console.error('Erro ao deletar imagem do storage:', storageError);
        }
      }
    }
  }

  // Delete the property (this will cascade delete related records)
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) throw error;
};