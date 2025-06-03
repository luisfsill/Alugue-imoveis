import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Image {
  src: string;
  alt: string;
}

interface ImageGalleryProps {
  images: Image[];
  onClose?: () => void;
  initialIndex?: number;
}

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const imageVariants = {
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

const thumbnailHoverVariants = {
  hover: { 
    scale: 1.05,
    transition: { duration: 0.3 }
  }
};

export function ImageGallery({ images, onClose, initialIndex = 0 }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const previewCount = 3;
  const controls = useAnimation();
  const modalRef = useRef<HTMLDivElement>(null);

  // Reorganiza as imagens para que a foto de capa seja a primeira
  const reorderedImages = React.useMemo(() => {
    if (!images || images.length === 0) return [];
    
    const reordered = [...images];
    if (initialIndex > 0 && initialIndex < images.length) {
      // Move a foto de capa para o início
      const coverImage = reordered[initialIndex];
      reordered.splice(initialIndex, 1);
      reordered.unshift(coverImage);
    }
    return reordered;
  }, [images, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex]);

  // Reset state when modal closes
  const handleClose = () => {
    // Reset all state
    setSelectedIndex(null);
    setDirection(0);
    controls.set("center");
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setDirection(1);
    setSelectedIndex((prev) => 
      prev === null ? 0 : prev === reorderedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setDirection(-1);
    setSelectedIndex((prev) => 
      prev === null ? reorderedImages.length - 1 : prev === 0 ? reorderedImages.length - 1 : prev - 1
    );
  };

  const handleDragEnd = (_e: any, { offset, velocity }: any) => {
    const swipe = offset.x;
    
    if (Math.abs(velocity.x) > 500 || Math.abs(swipe) > 100) {
      if (swipe < 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    } else {
      controls.start("center");
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* Grid de miniaturas */}
      <div className="grid grid-cols-3 gap-4">
        {reorderedImages.slice(0, previewCount).map((image, index) => (
          <motion.div
            key={`${image.src}-${index}`}
            whileHover="hover"
            variants={thumbnailHoverVariants}
            onClick={() => setSelectedIndex(index)}
            className={`cursor-pointer aspect-square overflow-hidden rounded-lg relative ${
              index === previewCount - 1 && reorderedImages.length > previewCount ? 'group' : ''
            }`}
          >
            <img 
              src={image.src} 
              alt={image.alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {index === previewCount - 1 && reorderedImages.length > previewCount && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity group-hover:bg-black/70">
                <div className="text-center text-white px-2">
                  <p className="text-sm sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2">Clique para ver mais</p>
                  <p className="text-xs sm:text-sm">+{reorderedImages.length - previewCount} fotos</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div 
            ref={modalRef}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => {
              // Only close if clicking the backdrop
              if (e.target === modalRef.current) {
                handleClose();
              }
            }}
          >
            <div className="absolute top-0 right-0 left-0 h-16 bg-gradient-to-b from-black/50 to-transparent">
            </div>

            {/* Botão de fechar sempre visível */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="absolute top-36 right-8 sm:top-12 sm:right-6 md:top-32 md:right-40 text-white hover:text-white transition-colors p-2 sm:p-2 md:p-3 rounded-full bg-red-500/90 hover:bg-red-600/90 z-[60] shadow-2xl border-2 border-white/20"
              aria-label="Fechar galeria"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-20"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-20"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-12 h-12" />
            </button>

            <motion.div
              className="relative w-full h-[calc(100vh-200px)] flex items-center justify-center px-4"
              drag="x"
            >
              <div className="relative">
                <motion.img
                  key={selectedIndex}
                  src={reorderedImages[selectedIndex].src}
                  alt={reorderedImages[selectedIndex].alt}
                  className="max-h-full max-w-full object-contain select-none"
                  variants={imageVariants}
                  custom={direction}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={handleDragEnd}
                />
              </div>
            </motion.div>

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-0 right-0">
              <div className="flex justify-center space-x-2 px-4">
                {reorderedImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDirection(index > selectedIndex ? 1 : -1);
                      setSelectedIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-gray-500 hover:bg-gray-400'
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}