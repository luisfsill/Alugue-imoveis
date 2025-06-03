import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isTokenExpiring: boolean;
}

interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getTokenInfo: () => TokenInfo | null;
}

interface TokenInfo {
  expiresAt: number;
  expiresIn: number;
  isExpiring: boolean;
  timeUntilExpiry: string;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isTokenExpiring: false
  });

  // Função para formatar tempo restante
  const formatTimeUntilExpiry = useCallback((seconds: number): string => {
    if (seconds <= 0) return 'Expirado';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  // Função para obter informações do token
  const getTokenInfo = useCallback((): TokenInfo | null => {
    if (!state.session?.expires_at) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = state.session.expires_at;
    const expiresIn = expiresAt - now;
    const isExpiring = expiresIn <= 1800; // 30 minutos
    
    return {
      expiresAt,
      expiresIn,
      isExpiring,
      timeUntilExpiry: formatTimeUntilExpiry(expiresIn)
    };
  }, [state.session, formatTimeUntilExpiry]);

  // Função para refresh manual do token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Iniciando refresh manual do token...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erro no refresh:', error);
        toast.error('Erro ao renovar sessão');
        return false;
      }
      
      if (data.session) {
        console.log('✅ Token renovado com sucesso');
        console.log('📊 Nova expiração:', new Date(data.session.expires_at! * 1000));
        setState(prev => ({
          ...prev,
          session: data.session,
          user: data.session?.user ?? null,
          isTokenExpiring: false
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro crítico no refresh:', error);
      return false;
    }
  }, []);

  // Função para logout
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        session: null,
        isLoading: false,
        isTokenExpiring: false
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }, []);

  // Monitoramento de expiração do token
  useEffect(() => {
    let interval: number;
    
    if (state.session) {
      interval = window.setInterval(() => {
        const tokenInfo = getTokenInfo();
        
        if (tokenInfo) {
          const { expiresIn, isExpiring } = tokenInfo;
          
          // Atualiza estado se token está expirando
          setState(prev => ({
            ...prev,
            isTokenExpiring: isExpiring
          }));
          
          // Auto-refresh quando restam 15 minutos
          if (expiresIn <= 900 && expiresIn > 0) {
            console.log('⚠️ Token expira em 15min, fazendo auto-refresh...');
            refreshToken();
          }
          
          // Logout automático se token expirou
          if (expiresIn <= 0) {
            console.log('❌ Token expirado, fazendo logout...');
            toast.error('Sessão expirada. Faça login novamente.');
            signOut();
          }
        }
      }, 30000); // Verifica a cada 30 segundos
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [state.session, getTokenInfo, refreshToken, signOut]);

  // Setup inicial e listener de mudanças
  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Erro ao obter sessão inicial:', error);
      }
      
      setState({
        user: session?.user ?? null,
        session: session,
        isLoading: false,
        isTokenExpiring: false
      });
      
      if (session) {
        console.log('📱 Sessão inicial carregada');
        console.log('📊 Token expira em:', new Date(session.expires_at! * 1000));
      }
    });

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Evento de auth:', event);
        
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session: session,
          isLoading: false,
          isTokenExpiring: false
        }));
        
        // Log de eventos importantes
        if (event === 'SIGNED_IN') {
          console.log('✅ Login realizado');
          console.log('📊 Token expira em:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token renovado automaticamente');
          console.log('📊 Nova expiração:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
        } else if (event === 'SIGNED_OUT') {
          console.log('🔓 Logout realizado');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...state,
    signOut,
    refreshToken,
    getTokenInfo
  };
} 