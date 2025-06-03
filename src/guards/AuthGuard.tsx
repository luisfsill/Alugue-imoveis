import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole, supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAdmin = false,
  fallbackPath = '/login'
}) => {
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const location = useLocation();

  const maxRetries = 3;

  const checkAuthorization = async (attempt = 1) => {
    if (!user) {
      setIsAuthorized(false);
      return;
    }

    try {
      // Verificar se a sessão ainda é válida
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        throw new Error(`Erro de sessão: ${sessionError.message}`);
      }

      if (!session.session) {
        // Tentar refresh da sessão
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Erro no refresh da sessão:', refreshError);
          throw new Error('Sessão expirada - faça login novamente');
        }
      }

      // Verificar role do usuário
      const role = await getUserRole();
      setUserRole(role);

      // Verificar autorização baseada no role
      if (requireAdmin && role !== 'admin') {
        setError('Acesso negado: Você precisa ser administrador para acessar esta área.');
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
      setError(null);

    } catch (error) {
      console.error('AuthGuard: Erro ao verificar autorização:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Tentar algumas vezes antes de desistir
      if (attempt < maxRetries) {
        setRetryCount(attempt);
        
        setTimeout(() => {
          checkAuthorization(attempt + 1);
        }, 1000);
        
        return;
      }
      
      // Se chegou aqui, todas as tentativas falharam
      setError(errorMessage);
      setIsAuthorized(false);
      
      // Toast agendado para evitar erro de render
      setTimeout(() => {
        if (errorMessage.includes('Auth session missing') || errorMessage.includes('Sessão expirada')) {
          toast.error('Sessão expirada. Redirecionando para login...');
        } else {
          toast.error(`Erro de autenticação: ${errorMessage}`);
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      checkAuthorization();
    }
  }, [user, isLoading, requireAdmin]);

  // Loading state
  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Shield className="w-16 h-16 text-blue-600 mx-auto animate-pulse" />
            <RefreshCw className="w-6 h-6 text-blue-500 absolute -top-1 -right-1 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-700">
              Verificando Permissões
            </h2>
            <div className="text-sm text-gray-500">
              {retryCount > 0 && (
                <p>Tentativa {retryCount}/{maxRetries} - Conectando...</p>
              )}
              {retryCount === 0 && (
                <p>Validando acesso e carregando dados...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    if (!user) {
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="relative">
            <Shield className="w-16 h-16 text-red-500 mx-auto" />
            <AlertTriangle className="w-6 h-6 text-red-600 absolute -top-1 -right-1" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-800">
              {requireAdmin ? 'Acesso Administrativo Negado' : 'Acesso Negado'}
            </h2>
            
            <div className="space-y-2">
              <p className="text-red-600 font-medium">
                {error || 'Você não tem permissão para acessar esta área.'}
              </p>
              
              {userRole && (
                <p className="text-sm text-gray-600">
                  Seu nível de acesso: <span className="font-medium">{userRole}</span>
                  {requireAdmin && userRole !== 'admin' && (
                    <span className="block text-orange-600 mt-1">
                      Esta área requer privilégios de administrador.
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Voltar
            </button>
            
            <button
              onClick={() => window.location.href = userRole === 'admin' ? '/admin' : '/dashboard'}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {userRole === 'admin' ? 'Área Administrativa' : 'Meus Imóveis'}
            </button>
            
            {error && (
              <button
                onClick={() => {
                  setRetryCount(0);
                  setError(null);
                  setIsAuthorized(null);
                  checkAuthorization();
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Tentar Novamente
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}; 