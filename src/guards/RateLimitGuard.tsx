import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import { useRateLimit } from '../hooks/useRateLimit';
import { RateLimitConfig } from '../utils/rateLimiter';
import { useLocation } from 'react-router-dom';

interface RateLimitGuardProps {
  children: React.ReactNode;
  action: string;
  config?: RateLimitConfig;
  blockComponent?: React.ReactNode;
}

// Configurações predefinidas para diferentes rotas
const ROUTE_RATE_LIMITS = {
  admin_access: {
    maxAttempts: 20, // 20 tentativas
    windowMs: 5 * 60 * 1000,  // em 5 minutos
    blockDurationMs: 15 * 60 * 1000 // bloquear por 15 minutos
  },
  admin_users: {
    maxAttempts: 15, // 15 tentativas
    windowMs: 10 * 60 * 1000, // em 10 minutos  
    blockDurationMs: 30 * 60 * 1000 // bloquear por 30 minutos
  },
  sensitive_routes: {
    maxAttempts: 15, // 15 tentativas
    windowMs: 10 * 60 * 1000, // em 10 minutos
    blockDurationMs: 10 * 60 * 1000 // bloquear por 10 minutos
  }
} as const;

export function RateLimitGuard({ 
  children, 
  action, 
  config, 
  blockComponent 
}: RateLimitGuardProps) {
  const location = useLocation();
  const lastPathRef = useRef(location.pathname);

  // Usar configuração personalizada ou padrão
  const rateLimitConfig = config || ROUTE_RATE_LIMITS.sensitive_routes;
  
  const {
    isBlocked,
    remainingAttempts,
    timeRemaining,
    recordAttempt
  } = useRateLimit(action, rateLimitConfig);

  useEffect(() => {
    // Só registra tentativa se o pathname mudou de fato
    if (location.pathname !== lastPathRef.current) {
      recordAttempt();
      lastPathRef.current = location.pathname;
    }
  }, [location.pathname, recordAttempt]);

  // Log de segurança
  useEffect(() => {
    console.log(`📊 RateLimitGuard Status para '${action}':`, {
      isBlocked,
      remainingAttempts,
      timeRemaining,
      pathname: location.pathname
    });
    
    if (isBlocked) {
      console.warn(`🚫 RateLimitGuard: Acesso bloqueado para '${action}' - Tempo restante: ${timeRemaining}`);
    } else if (remainingAttempts <= 3) {
      console.warn(`⚠️ RateLimitGuard: Poucos acessos restantes para '${action}': ${remainingAttempts}`);
    }
  }, [isBlocked, remainingAttempts, timeRemaining, action, location.pathname]);

  // Se bloqueado, mostrar componente de bloqueio
  if (isBlocked) {
    if (blockComponent) {
      return <>{blockComponent}</>;
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
        <div className="text-center w-full max-w-lg mx-auto p-4 sm:p-8 bg-white rounded-lg shadow-md flex flex-col flex-grow justify-center">
          <div className="mb-6">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Temporariamente Bloqueado</h1>
            <p className="text-gray-600">
              Muitas tentativas de acesso foram detectadas. Por segurança, esta rota foi temporariamente bloqueada.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Tempo restante:</span>
            </div>
            <div className="text-2xl font-bold text-red-700">{timeRemaining}</div>
          </div>

          <div className="text-sm text-gray-500 mb-6">
            <p>⚡ Limite: 15 acessos em 10 minutos</p>
            <p>🔒 Bloqueio: 30 minutos</p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir para Início
            </button>
          </div>

          {/* Mensagem de segurança agora faz parte do conteúdo, com espaçamento */}
          <div className="mt-8">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start shadow-md">
              <Shield className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Medida de Segurança</p>
                <p>Este bloqueio protege contra tentativas de acesso abusivo. Se você é um usuário legítimo, aguarde o tempo indicado.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Permitir acesso normalmente
  return <>{children}</>;
}

// Hook utilitário para obter configurações de rate limit por rota
export function useRouteRateLimit(routePath: string): RateLimitConfig {
  const routeConfigs: Record<string, RateLimitConfig> = {
    '/admin': ROUTE_RATE_LIMITS.admin_access,
    '/dashboard': ROUTE_RATE_LIMITS.admin_access, // Mesmo rate limit que admin_access
    '/admin/users': ROUTE_RATE_LIMITS.admin_users,
    '/admin/reports': ROUTE_RATE_LIMITS.sensitive_routes,
    '/admin/settings': ROUTE_RATE_LIMITS.sensitive_routes,
  };

  return routeConfigs[routePath] || ROUTE_RATE_LIMITS.sensitive_routes;
}

// Componente para mostrar status de rate limit (opcional)
export function RateLimitStatus({ action }: { action: string }) {
  const config = ROUTE_RATE_LIMITS.sensitive_routes;
  const { remainingAttempts } = useRateLimit(action, config);

  // Em produção, mostrar aviso apenas se poucos acessos restantes
  if (remainingAttempts > 5) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-center">
        <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
        <span className="text-yellow-800 text-sm font-medium">
          Aviso de Segurança: {remainingAttempts} acessos restantes
        </span>
      </div>
    </div>
  );
} 