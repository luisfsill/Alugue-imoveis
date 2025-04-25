import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Trash2, Plus, X, LogOut, ArrowLeft, Edit2, AlertTriangle } from 'lucide-react';
import { supabase, getUserRole, signUp, signOut } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

interface DeleteConfirmation {
  show: boolean;
  userId: string;
  userEmail: string;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

function UserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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

        setUsers(data.map((userData: UserData) => ({
          id: userData.id,
          email: userData.email,
          role: userData.role as 'admin' | 'standard' || 'standard',
          created_at: userData.created_at
        })));

        console.log('Usuarios carregados:', data);
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
    if (user) {
      console.log('Usuário logado:', user.email);
    } else {
      console.log('Nenhum usuário logado');
    }
  }, [user]);

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

    if (!newUser.email || !newUser.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      setIsCreating(true);

      // Chamada para signUp com logging adicional
      console.log('Chamando signUp com:', newUser);
      await signUp(newUser.email, newUser.password, newUser.role);
      console.log('Usuário criado com sucesso');

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
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao criar usuário');
      }
      console.log('Erro detalhado:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = () => {
    // Implementar lógica de edição aqui se necessário
    toast.success('Funcionalidade de edição em desenvolvimento');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <Link 
            to="/admin" 
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-2 sm:mb-0"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Gerenciar Usuários
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Usuário
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
        </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nenhum usuário cadastrado.
          </p>
        ) : (
          <>
            {/* Versão Mobile - Cards */}
            <div className="block md:hidden space-y-4">
              {users.map(user => (
                <div key={user.id} className="bg-white border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium text-base">{user.email}</span>
                    <span className="text-sm text-gray-500">
                      Criado em: {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <div className="w-full">
                      <label className="block text-sm text-gray-500 mb-1">Função:</label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'standard')}
                        className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="standard">Padrão</option>
                      <option value="admin">Administrador</option>
                    </select>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditClick}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id, user.email)}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Versão Desktop - Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Data de Criação</th>
                    <th className="px-4 py-3">Função</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="text-sm hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-medium">{user.email}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'standard')}
                          className="w-auto px-3 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="standard">Padrão</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={handleEditClick}
                            className="flex items-center justify-center px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user.id, user.email)}
                            className="flex items-center justify-center px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      >
                            <Trash2 className="w-4 h-4 mr-1" />
                            <span>Excluir</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
        {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Novo Usuário</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função
                  </label>
                  <select
                    value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'standard' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                  <option value="standard">Padrão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isCreating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o usuário <span className="font-semibold">{deleteConfirmation.userEmail}</span>?
                Esta ação não pode ser desfeita.
              </p>
            <div className="flex justify-end gap-4">
                <button
                  onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Excluindo...
                    </>
                  ) : (
                  'Excluir'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default UserManagement;