import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
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

export function ImageGallery({ images, onClose }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const previewCount = 3;
  const controls = useAnimation();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
    setDirection(0);
    controls.set("center");
    if (onClose) onClose();
  }, [onClose, controls]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setDirection(1);
    setSelectedIndex((prev) => 
      prev === null ? 0 : prev === images.length - 1 ? 0 : prev + 1
    );
  }, [selectedIndex, images.length]);

  const handlePrevious = useCallback(() => {
    if (selectedIndex === null) return;
    setDirection(-1);
    setSelectedIndex((prev) => 
      prev === null ? images.length - 1 : prev === 0 ? images.length - 1 : prev - 1
    );
  }, [selectedIndex, images.length]);

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
  }, [selectedIndex, handleClose, handleNext, handlePrevious]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
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
        {images.slice(0, previewCount).map((image, index) => (
          <motion.div
            key={index}
            whileHover="hover"
            variants={thumbnailHoverVariants}
            onClick={() => setSelectedIndex(index)}
            className={`cursor-pointer aspect-square overflow-hidden rounded-lg relative ${
              index === previewCount - 1 && images.length > previewCount ? 'group' : ''
            }`}
          >
            <img 
              src={image.src} 
              alt={image.alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {index === previewCount - 1 && images.length > previewCount && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity group-hover:bg-black/70">
                <div className="text-center text-white">
                  <p className="text-xl font-semibold mb-2">Clique para ver mais</p>
                  <p className="text-sm">+{images.length - previewCount} fotos</p>
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
              if (e.target === modalRef.current) {
                handleClose();
              }
            }}
          >
            {/* Botão de fechar responsivo */}
            <div className="absolute top-20 right-20 p-4 sm:p-6 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 text-white hover:text-red-600 transition-all transform hover:scale-110"
                aria-label="Fechar galeria"
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-40"
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
              <motion.img
                key={selectedIndex}
                src={images[selectedIndex].src}
                alt={images[selectedIndex].alt}
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
            </motion.div>

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-0 right-0">
              <div className="flex justify-center space-x-2 px-4">
                {images.map((_, index) => (
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