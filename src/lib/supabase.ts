import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { secureTokenStorage } from '../utils/secureTokenStorage';
import { corsConfig, getCORSHeaders, logCORSConfig } from '../config/cors';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 CONFIGURAÇÃO SUPABASE FALTANDO:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ FALTANDO');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurado' : '❌ FALTANDO');
  throw new Error('Missing Supabase environment variables');
}

// Log da configuração CORS no desenvolvimento
if (process.env.NODE_ENV === 'development') {
  logCORSConfig();
}

/**
 * 🔒 NOTA SOBRE SEGURANÇA httpOnly:
 * 
 * httpOnly cookies são mais seguros, mas atualmente o Supabase não suporta 
 * nativamente em SPAs (Single Page Applications). Isso é uma limitação conhecida.
 * 
 * Para implementar httpOnly cookies, você precisaria:
 * 1. Um servidor backend (Node.js/Express) 
 * 2. Middleware que intercepta auth e configura cookies httpOnly
 * 3. Uso do pacote @supabase/ssr 
 * 
 * Por enquanto, localStorage é seguro o suficiente para a maioria dos casos:
 * - Tokens JWT têm expiração curta (1 hora)
 * - Rate limiting protege contra ataques
 * - HTTPS protege em trânsito
 * - PKCE flow adiciona camada extra de segurança
 * - CORS adequado protege contra origens não autorizadas
 */

/**
 * Cliente Supabase configurado com segurança avançada
 * Usando localStorage temporariamente até resolver httpOnly cookies
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    
    // Sistema de storage personalizado (localStorage por enquanto)
    storage: {
      getItem: (key: string) => {
        try {
          const token = secureTokenStorage.getToken(key);
          return token;
        } catch (error) {
          console.error(`Erro ao recuperar token '${key}':`, error);
          
          // Fallback direto para localStorage em caso de erro
          try {
            const fallback = localStorage.getItem(key);
            return fallback;
          } catch (fallbackError) {
            console.error(`Fallback também falhou:`, fallbackError);
            return null;
          }
        }
      },
      
      setItem: (key: string, value: string) => {
        try {
          // Usar nosso sistema seguro
          secureTokenStorage.setToken(key, value, {
            httpOnly: false, // Ainda não disponível para SPAs
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: key.includes('refresh') ? 7 * 24 * 60 * 60 : 2 * 24 * 60 * 60
          });
          
          // Double-check: verificar se foi armazenado corretamente
          const stored = secureTokenStorage.getToken(key);
          if (!stored || stored !== value) {
            localStorage.setItem(key, value);
          }
          
        } catch (error) {
          console.error(`Erro ao armazenar token '${key}':`, error);
          
          // Fallback direto para localStorage
          try {
            localStorage.setItem(key, value);
          } catch (fallbackError) {
            console.error(`Fallback também falhou:`, fallbackError);
          }
        }
      },
      
      removeItem: (key: string) => {
        try {
          secureTokenStorage.removeToken(key);
        } catch (error) {
          console.error(`Erro ao remover token '${key}':`, error);
          
          // Fallback para localStorage
          try {
            localStorage.removeItem(key);
          } catch (fallbackError) {
            console.error(`Fallback removeItem falhou:`, fallbackError);
          }
        }
      }
    },
    
    // Configurações avançadas de segurança
    flowType: 'pkce', // PKCE oferece segurança extra mesmo sem httpOnly
    debug: process.env.NODE_ENV === 'development'
  },
  
  // Headers globais com CORS adequado
  global: {
    headers: {
      'X-Client-Info': 'alugue-escarpas-web',
      'X-Security-Version': '2.2', // Atualizado com CORS
      'X-Environment': process.env.NODE_ENV || 'development',
      ...(typeof window !== 'undefined' && window.location.origin ? { 'Origin': window.location.origin } : {}),
      // Headers CORS específicos do Supabase
      ...getCORSHeaders(typeof window !== 'undefined' ? window.location.origin : undefined)
    }
  },
  
  // Configurações de rede com rate limiting
  realtime: {
    params: {
      eventsPerSecond: 10 // Limitar eventos para prevenir spam
    }
  }
});

// Re-exportar funções dos serviços para compatibilidade com código existente
export {
  // Auth
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  getUserRole,
  
  // Storage
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  
  // Properties  
  getFeaturedProperties,
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  
  // Users
  updateUserEmail,
  updateUserPassword
} from '../services/index';