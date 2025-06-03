import { supabase } from '../lib/supabase';

/**
 * Serviços de Storage
 * Responsável por todas as operações relacionadas ao armazenamento de arquivos
 */

export const storageService = {
  /**
   * Upload de uma imagem
   */
  async uploadImage(file: File): Promise<string> {
    try {
      // Validações básicas
      if (!file) {
        throw new Error('Arquivo não fornecido');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('Arquivo muito grande. Máximo 10MB permitido.');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas arquivos de imagem são permitidos');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      if (!data || !data.path) {
        throw new Error('Upload realizado mas sem dados de retorno');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      if (!publicUrl || !publicUrl.includes('property-images')) {
        throw new Error('URL pública inválida gerada');
      }

      return publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Erro ao fazer upload da imagem: ${errorMessage}`);
    }
  },

  /**
   * Upload de múltiplas imagens
   */
  async uploadMultipleImages(files: File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file));
      const imageUrls = await Promise.all(uploadPromises);
      return imageUrls;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Erro ao fazer upload das imagens');
    }
  },

  /**
   * Deletar uma imagem
   */
  async deleteImage(url: string): Promise<void> {
    try {
      const fileName = url.split('/').pop();
      if (!fileName) {
        throw new Error('URL de imagem inválida');
      }

      const { error } = await supabase.storage
        .from('property-images')
        .remove([fileName]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw new Error(`Erro ao deletar imagem: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Deletar múltiplas imagens
   */
  async deleteMultipleImages(urls: string[]): Promise<void> {
    try {
      const deletePromises = urls
        .filter(url => url && typeof url === 'string')
        .map(url => this.deleteImage(url));
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Erro ao deletar múltiplas imagens:', error);
      throw new Error('Erro ao deletar imagens');
    }
  }
}; 