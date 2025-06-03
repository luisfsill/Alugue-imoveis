import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import { useRateLimit } from '../hooks/useRateLimit';
import { RateLimitConfig } from '../utils/rateLimiter';

interface RateLimitGuardProps {
  children: React.ReactNode;
  action: string;
  config?: RateLimitConfig;
  blockComponent?: React.ReactNode;
}

interface RouteAccessState {
  isBlocked: boolean;
  remainingAttempts: number;
  timeRemaining: string;
  firstAccess: boolean;
}

// Configurações predefinidas para diferentes rotas
const ROUTE_RATE_LIMITS = {
  admin_access: {
    maxAttempts: process.env.NODE_ENV === 'development' ? 9999 : 20,          // Ilimitado em dev, 20 em produção
    windowMs: 5 * 60 * 1000,  // em 5 minutos
    blockDurationMs: process.env.NODE_ENV === 'development' ? 1000 : 15 * 60 * 1000 // 1s em dev, 15min em produção
  },
  admin_users: {
    maxAttempts: process.env.NODE_ENV === 'development' ? 9999 : 5,           // Ilimitado em dev, 5 em produção
    windowMs: 10 * 60 * 1000, // em 10 minutos  
    blockDurationMs: process.env.NODE_ENV === 'development' ? 1000 : 30 * 60 * 1000 // 1s em dev, 30min em produção
  },
  sensitive_routes: {
    maxAttempts: process.env.NODE_ENV === 'development' ? 9999 : 15,          // Ilimitado em dev, 15 em produção
    windowMs: 10 * 60 * 1000, // em 10 minutos
    blockDurationMs: process.env.NODE_ENV === 'development' ? 1000 : 10 * 60 * 1000 // 1s em dev, 10min em produção
  }
} as const;

export function RateLimitGuard({ 
  children, 
  action, 
  config, 
  blockComponent 
}: RateLimitGuardProps) {
  // 🔧 DESENVOLVIMENTO: Pular completamente o rate limiting
  if (process.env.NODE_ENV === 'development') {
    // Limpar qualquer rate limiting existente no localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rate_limit_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🔧 DESENVOLVIMENTO: Removidos ${keysToRemove.length} registros de rate limiting`);
      }
    } catch (error) {
      console.warn('Erro ao limpar rate limiting:', error);
    }

    console.log(`🔧 DESENVOLVIMENTO: Rate limiting desabilitado para '${action}'`);
    return <>{children}</>;
  }

  const [accessState, setAccessState] = useState<RouteAccessState>({
    isBlocked: false,
    remainingAttempts: 0,
    timeRemaining: '',
    firstAccess: true
  });

  // Usar configuração personalizada ou padrão
  const rateLimitConfig = config || ROUTE_RATE_LIMITS.sensitive_routes;
  
  const {
    isBlocked,
    remainingAttempts,
    timeRemaining,
    recordAttempt
  } = useRateLimit(action, rateLimitConfig);

  useEffect(() => {
    // Registrar tentativa de acesso à rota
    if (accessState.firstAccess) {
      console.log(`🛡️ RateLimitGuard: Registrando acesso à rota '${action}'`);
      recordAttempt();
      setAccessState(prev => ({ ...prev, firstAccess: false }));
    }

    // Atualizar estado
    setAccessState(prev => ({
      ...prev,
      isBlocked,
      remainingAttempts,
      timeRemaining
    }));

    // Log de segurança
    if (isBlocked) {
      console.warn(`🚫 RateLimitGuard: Acesso bloqueado para '${action}' - Tempo restante: ${timeRemaining}`);
    } else if (remainingAttempts <= 3) {
      console.warn(`⚠️ RateLimitGuard: Poucos acessos restantes para '${action}': ${remainingAttempts}`);
    }
  }, [isBlocked, remainingAttempts, timeRemaining, action, recordAttempt, accessState.firstAccess]);

  // Se bloqueado, mostrar componente de bloqueio
  if (isBlocked) {
    if (blockComponent) {
      return <>{blockComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md">
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
            <p>⚡ Limite: {rateLimitConfig.maxAttempts} acessos em {Math.floor(rateLimitConfig.windowMs / 60000)} minutos</p>
            <p>🔒 Bloqueio: {Math.floor(rateLimitConfig.blockDurationMs / 60000)} minutos</p>
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

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
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

  // Se não bloqueado, mas poucas tentativas restantes, mostrar aviso
  if (remainingAttempts <= 3 && remainingAttempts > 0) {
    console.warn(`⚠️ RateLimitGuard: Aviso - ${remainingAttempts} tentativas restantes para '${action}'`);
  }

  // Permitir acesso
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

  // Em desenvolvimento, mostrar informação diferente
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <Shield className="w-4 h-4 text-blue-600 mr-2" />
          <span className="text-blue-800 text-sm font-medium">
            🔧 Modo Desenvolvimento: Rate limiting desabilitado
          </span>
        </div>
      </div>
    );
  }

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