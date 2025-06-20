import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useImageLoader } from '../hooks/useImageLoader';

interface Image {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  images: Image[];
  initialIndex?: number;
  height?: string;
  showNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  onImageChange?: (index: number) => void;
}

const carouselVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  })
};

export function ImageCarousel({ 
  images, 
  initialIndex = 0, 
  height = "h-[200px]",
  showNavigation = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  className = "",
  onImageChange
}: ImageCarouselProps) {
  const [direction, setDirection] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const {
    currentIndex,
    isImageLoading,
    goToImage,
    nextImage,
    prevImage
  } = useImageLoader(images, initialIndex, {
    onImageLoad: (index) => {
      onImageChange?.(index);
    }
  });

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && images && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setDirection(1);
        nextImage();
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, images, nextImage]);

  // Pausa o auto-play quando o mouse está sobre o carrossel
  const handleMouseEnter = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (autoPlay && images && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setDirection(1);
        nextImage();
      }, autoPlayInterval);
    }
  }, [autoPlay, autoPlayInterval, images, nextImage]);

  const handleNext = useCallback(() => {
    setDirection(1);
    nextImage();
  }, [nextImage]);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    prevImage();
  }, [prevImage]);

  const handleGoToImage = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    goToImage(index);
  }, [currentIndex, goToImage]);

  if (!images || images.length === 0) {
    return (
      <div className={`${height} bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-400">Nenhuma imagem disponível</div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading indicator */}
      {isImageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Image container */}
      <div className={`relative ${height}`}>
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={`${currentIndex}-${images[currentIndex]?.src}`}
            src={images[currentIndex]?.src}
            alt={images[currentIndex]?.alt}
            className={`w-full h-full object-cover absolute`}
            variants={carouselVariants}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
          />
        </AnimatePresence>
        
        {/* Placeholder div to maintain height */}
        <div className={`relative ${height}`} />
      </div>

      {/* Navigation buttons */}
      {showNavigation && images.length > 1 && (
        <>
          <div className="absolute top-1/2 left-2 -translate-y-1/2 opacity-0 group-hover:opacity-90 transition-opacity duration-300 z-10">
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrevious();
              }}
              className="rounded-full bg-gray-800/50 p-1.5 hover:bg-gray-800/75 transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
          </div>
          <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-90 transition-opacity duration-300 z-10">
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="rounded-full bg-gray-800/50 p-1.5 hover:bg-gray-800/75 transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0">
          <div className="flex justify-center space-x-1 px-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGoToImage(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 