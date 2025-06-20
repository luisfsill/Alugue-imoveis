import { useState, useEffect, useCallback } from 'react';

interface Image {
  src: string;
  alt: string;
}

interface UseImageLoaderOptions {
  preloadCount?: number;
  onImageLoad?: (index: number) => void;
  onImageError?: (index: number, error: string) => void;
}

export function useImageLoader(
  images: Image[],
  initialIndex: number = 0,
  options: UseImageLoaderOptions = {}
) {
  const { preloadCount = 3, onImageLoad, onImageError } = options;
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Pré-carrega as imagens
  const preloadImages = useCallback((startIndex: number) => {
    if (!images || images.length === 0) return;
    
    const imagesToPreload = [];
    
    // Pré-carrega a imagem atual e as próximas
    for (let i = 0; i < preloadCount; i++) {
      const index = (startIndex + i) % images.length;
      if (!loadedImages.has(index)) {
        imagesToPreload.push(index);
      }
    }
    
    // Pré-carrega a imagem anterior
    const prevIndex = startIndex === 0 ? images.length - 1 : startIndex - 1;
    if (!loadedImages.has(prevIndex)) {
      imagesToPreload.push(prevIndex);
    }

    imagesToPreload.forEach(index => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, index]));
        onImageLoad?.(index);
      };
      img.onerror = () => {
        const error = `Erro ao carregar imagem ${index}: ${images[index].src}`;
        console.warn(error);
        onImageError?.(index, error);
      };
      img.src = images[index].src;
    });
  }, [images, loadedImages, preloadCount, onImageLoad, onImageError]);

  // Função para carregar uma imagem específica
  const loadImage = useCallback((index: number) => {
    if (!images || loadedImages.has(index)) return;
    
    setIsImageLoading(true);
    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set([...prev, index]));
      setIsImageLoading(false);
      onImageLoad?.(index);
    };
    img.onerror = () => {
      const error = `Erro ao carregar imagem ${index}: ${images[index].src}`;
      console.warn(error);
      setIsImageLoading(false);
      onImageError?.(index, error);
    };
    img.src = images[index].src;
  }, [images, loadedImages, onImageLoad, onImageError]);

  // Pré-carrega as primeiras imagens quando o componente é montado
  useEffect(() => {
    if (images && images.length > 0) {
      preloadImages(initialIndex);
    }
  }, [images, initialIndex, preloadImages]);

  // Pré-carrega imagens quando o índice atual muda
  useEffect(() => {
    if (images && images.length > 0) {
      preloadImages(currentIndex);
    }
  }, [currentIndex, preloadImages]);

  const goToImage = useCallback((index: number) => {
    if (index === currentIndex) return;
    
    setCurrentIndex(index);
    
    // Pré-carrega a imagem se necessário
    if (!loadedImages.has(index)) {
      loadImage(index);
    }
  }, [currentIndex, loadedImages, loadImage]);

  const nextImage = useCallback(() => {
    if (!images || images.length <= 1) return;
    
    const nextIndex = (currentIndex + 1) % images.length;
    goToImage(nextIndex);
  }, [currentIndex, images, goToImage]);

  const prevImage = useCallback(() => {
    if (!images || images.length <= 1) return;
    
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    goToImage(prevIndex);
  }, [currentIndex, images, goToImage]);

  return {
    currentIndex,
    loadedImages,
    isImageLoading,
    goToImage,
    nextImage,
    prevImage,
    loadImage,
    preloadImages
  };
} 