import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Shield, LogOut } from 'lucide-react';
import { useRateLimit } from '../hooks/useRateLimit';
import { useAuth } from '../hooks/useAuth';
import { RateLimitConfig } from '../utils/rateLimiter';
import { toast } from 'react-hot-toast';

interface RateLimitGuardProps {
  children: React.ReactNode;
  action: string;
  config?: RateLimitConfig;
  blockComponent?: React.ReactNode;
}

// Configurações predefinidas para diferentes rotas
const ROUTE_RATE_LIMITS = {
  admin_access: {
    maxAttempts: process.env.NODE_ENV === 'development' ? 9999 : 20,          // Ilimitado em dev, 20 em produção
    windowMs: 5 * 60 * 1000,  // em 5 minutos
    blockDurationMs: process.env.NODE_ENV === 'development' ? 1000 : 15 * 60 * 1000 // 1s em dev, 15min em produção
  },
  admin_users: {
    maxAttempts: process.env.NODE_ENV === 'development' ? 9999 : 10,          // Ilimitado em dev, 10 em produção
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
    // Limpar qualquer rate limiting existente no localStorage (sistema antigo e novo)
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('rate_limit_') || key.startsWith('rl_') || key.startsWith('rlb_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpar também sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('_bkp')) {
          sessionStorage.removeItem(key);
        }
      }
      
      if (keysToRemove.length > 0) {
        console.log(`🔧 DESENVOLVIMENTO: Removidos ${keysToRemove.length} registros de rate limiting`);
      }
    } catch (error) {
      console.warn('Erro ao limpar rate limiting:', error);
    }

    console.log(`🔧 DESENVOLVIMENTO: Rate limiting desabilitado para '${action}'`);
    return <>{children}</>;
  }

  const [firstAccess, setFirstAccess] = useState(true);

  // Hook de autenticação para logout
  const { signOut } = useAuth();

  // Usar configuração personalizada ou padrão
  const rateLimitConfig = config || ROUTE_RATE_LIMITS.sensitive_routes;
  
  const {
    isBlocked,
    remainingAttempts,
    timeRemaining,
    recordAttempt
  } = useRateLimit(action, rateLimitConfig);

  // Função para lidar com logout
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso');
      // Aguardar um pouco antes de redirecionar para mostrar o toast
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  useEffect(() => {
    // Registrar tentativa de acesso à rota apenas uma vez
    if (firstAccess) {
      console.log(`🛡️ RateLimitGuard: Registrando acesso à rota '${action}'`);
      recordAttempt();
      setFirstAccess(false);
    }
  }, [firstAccess, action, recordAttempt]);

  // Log de segurança
  useEffect(() => {
    if (isBlocked) {
      console.warn(`🚫 RateLimitGuard: Acesso bloqueado para '${action}' - Tempo restante: ${timeRemaining}`);
    } else if (remainingAttempts <= 3) {
      console.warn(`⚠️ RateLimitGuard: Poucos acessos restantes para '${action}': ${remainingAttempts}`);
    }
  }, [isBlocked, remainingAttempts, timeRemaining, action]);

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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <LogOut className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Opção Disponível</p>
                <p>Se preferir, você pode fazer logout e sair do sistema enquanto aguarda o desbloqueio.</p>
              </div>
            </div>
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
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Fazer Logout
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
  // Determinar configuração específica baseada na action
  let specificConfig: RateLimitConfig = ROUTE_RATE_LIMITS.sensitive_routes;
  if (action.includes('admin_users')) {
    specificConfig = ROUTE_RATE_LIMITS.admin_users;
  } else if (action.includes('admin_access') || action.includes('dashboard')) {
    specificConfig = ROUTE_RATE_LIMITS.admin_access;
  }

  const { remainingAttempts, isBlocked } = useRateLimit(action, specificConfig);

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

  // Se bloqueado, não mostrar este componente (o RateLimitGuard já cuida disso)
  if (isBlocked) return null;

  // Sempre mostrar os acessos restantes para a área de gerenciar usuários
  if (action.includes('admin_users')) {
    const acessosRestantes = remainingAttempts;
    const totalAcessos = process.env.NODE_ENV === 'development' ? 9999 : 10;
    
    if (acessosRestantes <= 3) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-red-800 text-sm font-medium">
              ⚠️ Cuidado! Apenas {acessosRestantes} de {totalAcessos} acessos restantes antes do bloqueio de 30 minutos
            </span>
          </div>
        </div>
      );
    } else if (acessosRestantes <= 7) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <Shield className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm font-medium">
              💡 Aviso: {acessosRestantes} de {totalAcessos} acessos restantes (bloqueio em 30 min se exceder)
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <Shield className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-green-800 text-sm font-medium">
              ✅ Área Protegida: {acessosRestantes} de {totalAcessos} acessos disponíveis
            </span>
          </div>
        </div>
      );
    }
  }

  // Para outras rotas, mostrar aviso apenas se poucos acessos restantes
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