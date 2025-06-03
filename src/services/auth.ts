import { supabase } from '../lib/supabase';

/**
 * Serviços de Autenticação
 * Responsável por todas as operações relacionadas à autenticação de usuários
 */

export const authService = {
  /**
   * Realizar login do usuário
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Email ou senha inválidos'
          : error.message
      );
    }

    return data;
  },

  /**
   * Registrar novo usuário
   */
  async signUp(email: string, password: string, role: 'admin' | 'standard' = 'standard') {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: {
          role
        }
      }
    });

    if (error) {
      throw new Error(
        error.message === 'User already registered'
          ? 'Este email já está cadastrado'
          : error.message
      );
    }

    return data;
  },

  /**
   * Deslogar usuário
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Obter usuário atual
   */
  async getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user;
  },

  /**
   * Obter role do usuário
   */
  async getUserRole(): Promise<'admin' | 'standard'> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return (user?.user_metadata?.role as 'admin' | 'standard') || 'standard';
  }
}; 