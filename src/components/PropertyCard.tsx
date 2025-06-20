import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { Image } from 'lucide-react';
import type { Property } from '../types/property';
import { ImageCarousel } from './ImageCarousel';

interface PropertyCardProps {
  property: Property;
}

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