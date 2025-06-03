/**
 * 🛡️ Configuração de CORS para Segurança
 * 
 * CORS (Cross-Origin Resource Sharing) protege contra ataques de origens não autorizadas.
 * É fundamental para segurança em produção.
 */

interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge?: number;
}

// Detectar ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Origens permitidas por ambiente
 */
const getAllowedOrigins = (): string[] => {
  if (isDevelopment) {
    return [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
  }

  if (isProduction) {
    // 🚨 IMPORTANTE: Domínios reais de produção configurados
    return [
      'https://aluguescarpas.netlify.app', // Domínio principal de produção
      'https://www.aluguescarpas.netlify.app', // Versão com www (se configurada)
      // Adicione outros domínios se necessário (staging, custom domain, etc.)
    ];
  }

  // Fallback para staging ou outros ambientes
  return [
    'https://staging-seu-dominio.com',
  ];
};

/**
 * Configuração principal do CORS
 */
export const corsConfig: CORSConfig = {
  allowedOrigins: getAllowedOrigins(),
  allowedMethods: [
    'GET',
    'POST', 
    'PUT',
    'DELETE',
    'OPTIONS',
    'PATCH'
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'apikey', // Para Supabase
    'X-Client-Info',
    'X-Security-Version', 
    'X-Environment',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: true, // Permite cookies e headers de auth
  maxAge: 86400 // Cache preflight por 24 horas
};

/**
 * Verificar se uma origem é permitida
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;
  
  // Em desenvolvimento, ser mais permissivo
  if (isDevelopment) {
    return corsConfig.allowedOrigins.some(allowed => 
      origin.startsWith(allowed) || 
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    );
  }
  
  // Em produção, ser restritivo
  return corsConfig.allowedOrigins.includes(origin);
};

/**
 * Headers de CORS para respostas manuais
 */
export const getCORSHeaders = (origin?: string) => {
  const headers: Record<string, string> = {};
  
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  headers['Access-Control-Allow-Methods'] = corsConfig.allowedMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = corsConfig.allowedHeaders.join(', ');
  
  if (corsConfig.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  if (corsConfig.maxAge) {
    headers['Access-Control-Max-Age'] = corsConfig.maxAge.toString();
  }
  
  return headers;
};

/**
 * Log de configuração de CORS
 */
export const logCORSConfig = () => {
  console.log('🛡️ CORS Configuration:');
  console.log('📍 Environment:', process.env.NODE_ENV);
  console.log('🌐 Allowed Origins:', corsConfig.allowedOrigins);
  console.log('📋 Methods:', corsConfig.allowedMethods);
  console.log('🔑 Credentials:', corsConfig.credentials);
  
  if (isProduction && corsConfig.allowedOrigins.some(origin => 
    origin.includes('seu-dominio.com') || 
    origin.includes('example.com')
  )) {
    console.warn('⚠️ ATENÇÃO: Configure os domínios reais de produção em src/config/cors.ts');
  }
}; 