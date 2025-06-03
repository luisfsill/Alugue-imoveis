import { supabase } from '../lib/supabase';

/**
 * Serviços de Usuários
 * Responsável por todas as operações relacionadas ao gerenciamento de usuários
 */

export const usersService = {
  /**
   * Atualizar email do usuário
   */
  async updateUserEmail(userId: string, newEmail: string): Promise<void> {
    const { error } = await supabase.rpc('update_user_email', {
      user_id: userId,
      new_email: newEmail
    });

    if (error) throw error;
  },

  /**
   * Atualizar senha do usuário
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabase.rpc('update_user_password', {
      user_id: userId,
      new_password: newPassword
    });

    if (error) throw error;
  },

  /**
   * Listar todos os usuários (apenas para admins)
   */
  async getAllUsers() {
    // Verificar se o usuário atual é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const userRole = user.user_metadata?.role || 'standard';
    if (userRole !== 'admin') {
      throw new Error('Access denied: Admin role required');
    }

    // Buscar usuários através de uma função do Supabase
    const { data, error } = await supabase.rpc('get_all_users');
    
    if (error) throw error;
    return data;
  },

  /**
   * Atualizar role do usuário (apenas para admins)
   */
  async updateUserRole(userId: string, newRole: 'admin' | 'standard'): Promise<void> {
    // Verificar se o usuário atual é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const userRole = user.user_metadata?.role || 'standard';
    if (userRole !== 'admin') {
      throw new Error('Access denied: Admin role required');
    }

    const { error } = await supabase.rpc('update_user_role', {
      user_id: userId,
      new_role: newRole
    });

    if (error) throw error;
  },

  /**
   * Deletar usuário (apenas para admins)
   */
  async deleteUser(userId: string): Promise<void> {
    // Verificar se o usuário atual é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const userRole = user.user_metadata?.role || 'standard';
    if (userRole !== 'admin') {
      throw new Error('Access denied: Admin role required');
    }

    const { error } = await supabase.rpc('delete_user', {
      user_id: userId
    });

    if (error) throw error;
  }
}; 