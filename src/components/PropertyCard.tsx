import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { Image } from 'lucide-react';
import type { Property } from '../types/property';
import React, { Suspense } from 'react';

interface PropertyCardProps {
  property: Property;
}

const ImageCarousel = React.lazy(() => import('./ImageCarousel'));

const PropertyCard = ({ property }: PropertyCardProps) => {
  // Reorganiza as imagens para que a foto de capa seja a primeira
  const orderedImages = useMemo(() => {
    if (!property.images || property.images.length === 0) return [];
    
    const images = [...property.images];
    if (property.coverPhotoIndex && property.coverPhotoIndex < images.length) {
      const coverPhoto = images[property.coverPhotoIndex];
      images.splice(property.coverPhotoIndex, 1);
      images.unshift(coverPhoto);
    }
    return images;
  }, [property.images, property.coverPhotoIndex]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        {orderedImages.length > 0 ? (
          <Suspense fallback={
            <div className="flex justify-center items-center h-48">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-blue-600">Carregando imagens...</span>
            </div>
          }>
            <ImageCarousel
              images={orderedImages.map((src, index) => ({
                src,
                alt: `${property.title} - Imagem ${index + 1}`
              }))}
              initialIndex={0}
              height="h-48"
              showNavigation={true}
              autoPlay={false}
              className="group"
            />
          </Suspense>
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {property.isFeatured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm flex items-center z-20">
            <Star className="w-4 h-4 mr-1" />
            Destaque
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard; 