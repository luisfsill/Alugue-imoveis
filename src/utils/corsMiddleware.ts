/**
 * 🛡️ Middleware CORS para Interceptação de Requisições
 * 
 * Este middleware adiciona headers CORS adequados para todas as requisições,
 * garantindo que apenas origens autorizadas possam acessar os recursos.
 */

import { corsConfig, isOriginAllowed, getCORSHeaders } from '../config/cors';

/**
 * Interceptador de requisições para adicionar CORS
 */
export class CORSMiddleware {
  /**
   * Adicionar headers CORS a uma requisição
   */
  static addCORSHeaders = (request: Request): Request => {
    const origin = request.headers.get('Origin') || window.location.origin;
    
    if (!isOriginAllowed(origin)) {
      console.warn(`🚨 CORS: Origem não autorizada: ${origin}`);
      // Em produção, bloquear a requisição
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`CORS: Origem não autorizada: ${origin}`);
      }
    }

    // Criar nova requisição com headers CORS
    const corsHeaders = getCORSHeaders(origin);
    const enhancedHeaders = new Headers(request.headers);
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      enhancedHeaders.set(key, value);
    });

    // Adicionar headers de segurança extra
    enhancedHeaders.set('X-Requested-With', 'XMLHttpRequest');
    enhancedHeaders.set('X-CORS-Validated', 'true');
    enhancedHeaders.set('X-Origin-Verified', isOriginAllowed(origin) ? 'true' : 'false');

    return new Request(request.url, {
      method: request.method,
      headers: enhancedHeaders,
      body: request.body,
      mode: 'cors',
      credentials: 'include',
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      integrity: request.integrity
    });
  };

  /**
   * Interceptador para fetch nativo
   */
  static interceptFetch = () => {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      try {
        // Converter para Request se necessário
        let request: Request;
        if (input instanceof Request) {
          request = input;
        } else {
          request = new Request(input, init);
        }

        // Verificar se é uma requisição para o Supabase ou API externa
        const url = new URL(request.url);
        const isSupabaseRequest = url.hostname.includes('supabase');
        const isAPIRequest = url.pathname.startsWith('/api');

        if (isSupabaseRequest || isAPIRequest) {
          request = CORSMiddleware.addCORSHeaders(request);
        }

        // Fazer a requisição original
        const response = await originalFetch(request);

        // Log em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`🛡️ CORS Request to ${url.hostname}:`, {
            origin: window.location.origin,
            allowed: isOriginAllowed(window.location.origin),
            status: response.status
          });
        }

        return response;
      } catch (error) {
        console.error('🚨 CORS Middleware Error:', error);
        throw error;
      }
    };

    // Log da instalação
    console.log('🛡️ CORS Middleware instalado');
  };

  /**
   * Verificar se a origem atual é válida
   */
  static validateCurrentOrigin = (): boolean => {
    const currentOrigin = window.location.origin;
    const isValid = isOriginAllowed(currentOrigin);
    
    if (!isValid) {
      console.error('🚨 CORS: Origem atual não autorizada:', currentOrigin);
      console.log('📋 Origens permitidas:', corsConfig.allowedOrigins);
      
      // Em produção, redirecionar ou mostrar erro
      if (process.env.NODE_ENV === 'production') {
        alert('Acesso não autorizado. Redirecionando...');
        window.location.href = corsConfig.allowedOrigins[0] || 'https://seu-dominio.com';
      }
    }
    
    return isValid;
  };

  /**
   * Inicializar middleware CORS completo
   */
  static initialize = () => {
    // Validar origem atual
    CORSMiddleware.validateCurrentOrigin();
    
    // Interceptar fetch
    CORSMiddleware.interceptFetch();
    
    // Adicionar listener para mudanças de origin (se necessário)
    // Navigation API ainda é experimental, usar com cautela
    try {
      const nav = (window as any).navigation;
      if (nav && typeof nav.addEventListener === 'function') {
        nav.addEventListener('navigate', () => {
          setTimeout(() => CORSMiddleware.validateCurrentOrigin(), 100);
        });
      }
    } catch (error) {
      // Navigation API não suportada, continuar sem ela
      console.log('Navigation API não disponível');
    }

    console.log('✅ CORS Security inicializado');
  };
}

/**
 * Header personalizado para requisições manuais
 */
export const createCORSRequest = (options: RequestInit = {}): RequestInit => {
  const origin = window.location.origin;
  
  if (!isOriginAllowed(origin)) {
    throw new Error(`CORS: Origem não autorizada: ${origin}`);
  }

  const corsHeaders = getCORSHeaders(origin);
  
  return {
    ...options,
    mode: 'cors',
    credentials: 'include',
    headers: {
      ...corsHeaders,
      ...options.headers,
      'X-Requested-With': 'XMLHttpRequest',
      'X-CORS-Validated': 'true'
    }
  };
}; 