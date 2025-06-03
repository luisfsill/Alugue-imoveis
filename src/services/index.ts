/**
 * Serviços da Aplicação
 * Ponto central de exportação de todos os serviços organizados por domínio
 */

// Importar todos os serviços
import { authService } from './auth';
import { storageService } from './storage';
import { propertiesService } from './properties';
import { usersService } from './users';

// Exportar serviços principais
export { authService } from './auth';
export { storageService } from './storage';
export { propertiesService } from './properties';
export { usersService } from './users';

// Exportar com nomes alternativos para facilitar o uso
export const auth = authService;
export const properties = propertiesService;
export const storage = storageService;
export const users = usersService;

// Funções de compatibilidade para migração gradual (exportações individuais)
export const signIn = authService.signIn.bind(authService);
export const signUp = authService.signUp.bind(authService);
export const signOut = authService.signOut.bind(authService);
export const getCurrentUser = authService.getCurrentUser.bind(authService);
export const getUserRole = authService.getUserRole.bind(authService);

export const uploadImage = storageService.uploadImage.bind(storageService);
export const uploadMultipleImages = storageService.uploadMultipleImages.bind(storageService);
export const deleteImage = storageService.deleteImage.bind(storageService);

export const getFeaturedProperties = propertiesService.getFeaturedProperties.bind(propertiesService);
export const getProperties = propertiesService.getProperties.bind(propertiesService);
export const getProperty = propertiesService.getProperty.bind(propertiesService);
export const createProperty = propertiesService.createProperty.bind(propertiesService);
export const updateProperty = propertiesService.updateProperty.bind(propertiesService);
export const deleteProperty = propertiesService.deleteProperty.bind(propertiesService);

export const updateUserEmail = usersService.updateUserEmail.bind(usersService);
export const updateUserPassword = usersService.updateUserPassword.bind(usersService);

// Re-export property types for convenience
export type {
  Property,
  PropertyFeatures
} from '../types/property'; 