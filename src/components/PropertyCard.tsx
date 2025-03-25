import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Image } from 'lucide-react';
import type { Property } from '../types/property';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % orderedImages.length);
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + orderedImages.length) % orderedImages.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        {orderedImages.length > 0 ? (
          <>
            <img
              src={orderedImages[currentImageIndex]}
              alt={property.title}
              className="w-full h-48 object-cover"
            />
            {orderedImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {property.isFeatured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Destaque
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard; 