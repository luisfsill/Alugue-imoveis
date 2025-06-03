import React, { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth as useAdvancedAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isTokenExpiring?: boolean;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getTokenInfo: () => any;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  isLoading: true,
  signOut: async () => {},
  refreshToken: async () => false,
  getTokenInfo: () => null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAdvancedAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}