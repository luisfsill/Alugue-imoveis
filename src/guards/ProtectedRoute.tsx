import React from 'react';
import { useLocation } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { RateLimitGuard, useRouteRateLimit } from './RateLimitGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  customRateLimit?: {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
  };
  fallbackPath?: string;
  fixedWarning?: boolean;
}

/**
 * ProtectedRoute - Sistema completo de proteção de rotas
 * 
 * Combina:
 * 1. AuthGuard - Verificação de autenticação e autorização
 * 2. RateLimitGuard - Proteção contra abuso de acesso
 * 
 * Recursos:
 * - Autenticação com JWT refresh automático
 * - Verificação de roles (admin/user)
 * - Rate limiting por rota
 * - Logs de segurança
 * - UX com feedback visual
 */
export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  customRateLimit,
  fallbackPath = '/login',
  fixedWarning = false
}: ProtectedRouteProps) {
  const location = useLocation();
  
  // Gerar identificador único para a rota
  const routeAction = `route_access_${location.pathname.replace(/\//g, '_')}`;
  
  // Configuração de rate limit para esta rota - sempre chamar o hook
  const defaultRouteRateLimit = useRouteRateLimit(location.pathname);
  const routeRateLimit = customRateLimit || defaultRouteRateLimit;

  console.log(`🛡️ ProtectedRoute: Protegendo rota '${location.pathname}' com guards:`, {
    authGuard: true,
    rateLimitGuard: true,
    requireAdmin,
    rateLimitConfig: routeRateLimit
  });

  return (
    <RateLimitGuard 
      action={routeAction}
      config={routeRateLimit}
      fixedWarning={fixedWarning}
    >
      <AuthGuard 
        requireAdmin={requireAdmin}
        fallbackPath={fallbackPath}
      >
        {children}
      </AuthGuard>
    </RateLimitGuard>
  );
}

// Utilitários para configurações específicas de rotas

/**
 * AdminRoute - Rota protegida para administradores
 */
export function AdminRoute({ children, ...props }: { children: React.ReactNode; [key: string]: any }) {
  return (
    <ProtectedRoute requireAdmin={true} {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * UserRoute - Rota protegida para usuários autenticados
 */
export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={false}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * HighSecurityRoute - Rota com rate limiting mais restritivo
 */
export function HighSecurityRoute({ 
  children, 
  requireAdmin = true 
}: { 
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const restrictiveRateLimit = {
    maxAttempts: 15,           // 15 tentativas
    windowMs: 10 * 60 * 1000,  // em 10 minutos
    blockDurationMs: 30 * 60 * 1000 // bloquear por 30 minutos
  };

  return (
    <ProtectedRoute 
      requireAdmin={requireAdmin}
      customRateLimit={restrictiveRateLimit}
    >
      {children}
    </ProtectedRoute>
  );
} 