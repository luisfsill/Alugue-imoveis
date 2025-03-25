export interface PropertyFeatures {
  has_pool: boolean;
  has_garden: boolean;
  has_garage: boolean;
  has_security_system: boolean;
  has_air_conditioning: boolean;
  has_premium_appliances: boolean;
}

export interface Property {
  id?: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: 'sale' | 'rent';
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  coverPhotoIndex: number;
  features: PropertyFeatures;
  isFeatured: boolean;
  brokerPhone?: string;
  brokerEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}