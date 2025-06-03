import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Trash2, Plus, X, LogOut, ArrowLeft, Edit2, AlertTriangle } from 'lucide-react';
import { supabase, getUserRole, signUp, signOut } from '../lib/supabase';
import { useSession } from '@supabase/auth-helpers-react';
import { useRateLimit } from '../hooks/useRateLimit';
import { RateLimitStatus } from '../guards';
import { useBotDetectionForForm } from '../hooks/useBotDetection';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'standard';
  created_at: string;
}

interface NewUser {
  email: string;
  password: string;
  role: 'admin' | 'standard';
}

interface EditUser {
  id: string;
  email: string;
  password: string;
}

interface DeleteConfirmation {
  show: boolean;
  userId: string;
  userEmail: string;
}

function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    userId: '',
    userEmail: ''
  });
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    role: 'standard'
  });
  const [editUser, setEditUser] = useState<EditUser>({
    id: '',
    email: '',
    password: ''
  });
  const session = useSession();

  // Rate limiting para criação de usuários
  const {
    isBlocked: isCreateBlocked,
    remainingAttempts: createRemainingAttempts,
    timeRemaining: createTimeRemaining,
    checkAllowed: checkCreateAllowed,
    recordAttempt: recordCreateAttempt,
    reset: resetCreateLimit
  } = useRateLimit('user_creation', {
    maxAttempts: 3,           // 3 criações
    windowMs: 60 * 60 * 1000, // em 1 hora
    blockDurationMs: 2 * 60 * 60 * 1000 // bloquear por 2 horas
  });

  // Bot detection para formulário de criação de usuários
  const {
    validateFormSubmission,
    isBot,
    confidence
  } = useBotDetectionForForm('user-creation');

  useEffect(() => {
    const initialize = async () => {
      try {
        const role = await getUserRole();
        if (role !== 'admin') {
          toast.error('Acesso não autorizado');
          navigate('/admin');
          return;
        }

        const { data, error } = await supabase.rpc('list_users');
        if (error) throw error;

        setUsers(data.map((user: any) => ({
          id: user.id,
          email: user.email,
          role: user.role || 'standard',
          created_at: user.created_at
        })));

        console.log('Usuarios carregados:', data); // Adicionado log para verificar os dados recebidos
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários');
        navigate('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [navigate]);

  useEffect(() => {
    if (session?.user) {
      console.log('Usuário logado:', session.user.email);
    } else {
      console.log('Nenhum usuário logado');
    }
  }, [session]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleDeleteClick = (userId: string, userEmail: string) => {
    setDeleteConfirmation({
      show: true,
      userId,
      userEmail
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const { error } = await supabase.rpc('delete_user', { user_id: deleteConfirmation.userId });
      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== deleteConfirmation.userId));
      toast.success('Usuário excluído com sucesso');
      setDeleteConfirmation({ show: false, userId: '', userEmail: '' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ show: false, userId: '', userEmail: '' });
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'standard') => {
    try {
      const { error } = await supabase.rpc('update_user_role', { 
        user_id: userId,
        new_role: newRole
      });
      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success('Função do usuário atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar função do usuário:', error);
      toast.error('Erro ao atualizar função do usuário');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar bot antes de qualquer validação
    const botValidation = await validateFormSubmission();
    if (!botValidation.allowed) {
      toast.error(botValidation.reason || 'Comportamento suspeito detectado');
      return;
    }

    // Verifica rate limiting antes de criar usuário
    if (!checkCreateAllowed()) {
      toast.error(`Muitas tentativas de criação. Tente novamente em ${createTimeRemaining}`);
      return;
    }

    if (!newUser.email || !newUser.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      setIsCreating(true);

      // Log de segurança
      console.log('🔐 Criação de usuário:', {
        email: newUser.email,
        role: newUser.role,
        botCheck: {
          isBot,
          confidence,
          validated: botValidation.allowed
        }
      });

      // Chamada para signUp com logging adicional
      console.log('Chamando signUp com:', newUser);
      await signUp(newUser.email, newUser.password, newUser.role);
      console.log('Usuário criado com sucesso');

      // Criação bem-sucedida, reseta o rate limiting
      resetCreateLimit();

      // Adicionar o novo usuário à lista de usuários localmente
      const newUserEntry = {
        id: '', // ID será preenchido pelo backend após o signup
        email: newUser.email,
        role: newUser.role,
        created_at: new Date().toISOString()
      };

      setUsers(prev => [...prev, newUserEntry]);

      setShowCreateModal(false);
      setNewUser({ email: '', password: '', role: 'standard' });
      toast.success('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      
      // Registra tentativa falhada
      recordCreateAttempt();
      
      // Log de segurança para tentativas suspeitas
      if (isBot) {
        console.warn('🚨 Tentativa suspeita de criação de usuário:', {
          email: newUser.email,
          botConfidence: confidence,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
      
      if (isCreateBlocked) {
        toast.error(`Limite de criação excedido. Tente novamente em ${createTimeRemaining}`);
      } else {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Erro ao criar usuário');
        }
        
        if (createRemainingAttempts <= 1) {
          toast.error(`${createRemainingAttempts} tentativa(s) restante(s) antes do bloqueio`);
        }
      }
      console.log('Erro detalhado:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditUser({
      id: user.id,
      email: user.email,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsEditing(true);

      // Atualizar email se mudou
      if (editUser.email !== users.find(u => u.id === editUser.id)?.email) {
        const { error: emailError } = await supabase.rpc('update_user_email', {
          user_id: editUser.id,
          new_email: editUser.email
        });
        if (emailError) throw emailError;
      }

      // Atualizar senha se foi fornecida
      if (editUser.password) {
        const { error: passwordError } = await supabase.rpc('update_user_password', {
          user_id: editUser.id,
          new_password: editUser.password
        });
        if (passwordError) throw passwordError;
      }

      // Atualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === editUser.id ? { ...user, email: editUser.email } : user
      ));

      toast.success('Usuário atualizado com sucesso!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao atualizar usuário');
      }
    } finally {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header responsivo */}
      <header className="text-white p-4 md:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <Link
                to="/admin"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm md:text-base px-2 py-1 rounded-lg hover:bg-blue-50 w-fit"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span>Voltar</span>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-black">Gerenciar Usuários</h1>
            </div>
            <RateLimitStatus action="route_access__admin_users" />
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-red-700 flex items-center justify-center text-sm md:text-base"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 flex-1">
        {/* Controles superiores */}
        <div className="flex justify-center sm:justify-start mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm md:text-base w-full sm:w-auto max-w-xs"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Criar Usuário
          </button>
        </div>

        {/* Tabela responsiva */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'standard')}
                        className="text-sm text-gray-900 border rounded-md px-2 py-1"
                      >
                        <option value="standard">Usuário Padrão</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded-full"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id, user.email)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet cards */}
          <div className="md:hidden">
            <div className="space-y-4 p-4">
              {users.map(user => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                      <div className="text-sm text-gray-900 break-all">{user.email}</div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Função</label>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'standard')}
                        className="w-full text-sm text-gray-900 border rounded-md px-2 py-1 mt-1"
                      >
                        <option value="standard">Usuário Padrão</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Criação</label>
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg flex items-center text-sm"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user.id, user.email)}
                      className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg flex items-center text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Criar Usuário - Responsivo */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold">Criar Novo Usuário</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    placeholder="Digite o email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    placeholder="Digite a senha"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-xs md:text-sm text-gray-500">
                    Mínimo de 6 caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'standard' }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  >
                    <option value="standard">Usuário Padrão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 md:gap-4 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 text-sm md:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm md:text-base ${
                      isCreating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isCreating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Criando...
                      </>
                    ) : (
                      'Criar Usuário'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Usuário - Responsivo */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold">Editar Usuário</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    placeholder="Digite o novo email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha (opcional)
                  </label>
                  <input
                    type="password"
                    value={editUser.password}
                    onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    placeholder="Digite a nova senha"
                    minLength={6}
                  />
                  <p className="mt-1 text-xs md:text-sm text-gray-500">
                    Deixe em branco para manter a senha atual
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 md:gap-4 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 text-sm md:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    className={`w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm md:text-base ${
                      isEditing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmação de Exclusão - Responsivo */}
        {deleteConfirmation.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                </div>
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-center mb-2">Confirmar Exclusão</h2>
              <p className="text-gray-600 text-center mb-6 text-sm md:text-base">
                Tem certeza que deseja excluir o usuário <br />
                <span className="font-semibold break-all">{deleteConfirmation.userEmail}</span>?
                <br />
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-center gap-3 md:gap-4">
                <button
                  onClick={handleDeleteCancel}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm md:text-base"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className={`w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center text-sm md:text-base ${
                    isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Excluindo...
                    </>
                  ) : (
                    'Sim, Excluir'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default UserManagement;