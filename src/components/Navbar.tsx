import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, LogIn, Menu, X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../lib/supabase';

function Navbar() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'standard'>('standard');
  const location = useLocation();
  const navigate = useNavigate();

  // Carregar role do usuário
  useEffect(() => {
    const loadUserRole = async () => {
      if (user) {
        try {
          const role = await getUserRole();
          setUserRole(role);
        } catch (error) {
          console.error('Erro ao carregar role do usuário:', error);
        }
      }
    };
    loadUserRole();
  }, [user]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLoginClick = () => {
    if (user) {
      // Direcionar para a área correta baseada no role
      const targetPath = userRole === 'admin' ? '/admin' : '/dashboard';
      navigate(targetPath);
    } else {
      navigate('/login');
    }
  };

  const handleInicioClick = (e?: React.MouseEvent) => {
    // Se já estiver na página inicial, rola para o topo
    if (location.pathname === '/') {
      e?.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleImoveisClick = (e?: React.MouseEvent) => {
    // Se já estiver na página de imóveis, rola para o topo
    if (location.pathname === '/properties') {
      e?.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const getAreaLabel = () => {
    if (!user) return 'Entrar';
    return userRole === 'admin' ? 'Área Administrativa' : 'Meus Imóveis';
  };

  const getAreaPath = () => {
    if (!user) return '/login';
    return userRole === 'admin' ? '/admin' : '/dashboard';
  };

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'Início',
      onClick: handleInicioClick
    },
    { 
      path: '/properties', 
      icon: Building2, 
      label: 'Imóveis',
      onClick: handleImoveisClick
    },
    { 
      path: getAreaPath(),
      icon: LogIn,
      label: getAreaLabel(),
      onClick: handleLoginClick
    }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-[90]">
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center h-16">
            <div className="hidden md:flex space-x-4 absolute left-1/2 transform -translate-x-1/2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={item.onClick}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Email do usuário - Desktop (lado direito, posicionamento absoluto) */}
            {user && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 absolute right-0">
                <User className="h-4 w-4" />
                <span className="font-medium">{user.email}</span>
              </div>
            )}

            {/* Layout Mobile - Botão de menu sempre à direita */}
            <div className="md:hidden flex items-center justify-between w-full">
              {/* Elemento central: e-mail do usuário ou um espaço reservado */}
              {user ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600 flex-1 justify-center">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-center truncate">{user.email}</span>
                </div>
              ) : (
                <div className="flex-1"></div> // Espaço reservado para empurrar o menu
              )}

              {/* Botão do menu mobile */}
              <button
                aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-lg font-semibold text-gray-900">Menu</span>
            <button
              aria-label="Fechar menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Email do usuário no menu mobile */}
          {user && (
            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="font-medium">{user.email}</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (item.onClick) {
                    item.onClick(e);
                  }
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                  location.pathname === item.path
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}

export default Navbar;