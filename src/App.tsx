import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute, UserRoute, HighSecurityRoute } from './guards';
import { CORSMiddleware } from './utils/corsMiddleware';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';

const Home = lazy(() => import('./pages/Home'));
const Properties = lazy(() => import('./pages/Properties'));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Login = lazy(() => import('./pages/Login'));

function App() {
  // Inicializar CORS middleware na inicialização da app
  useEffect(() => {
    CORSMiddleware.initialize();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Todas as rotas com layout */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-6 flex-grow">
                <Suspense fallback={<div className="text-center py-12 text-lg text-gray-500">Carregando...</div>}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/properties" element={<Properties />} />
                    <Route path="/properties/:id" element={<PropertyDetails />} />
                    
                    {/* Rota para usuários comuns - apenas seus próprios imóveis */}
                    <Route path="/dashboard" element={
                      <UserRoute>
                        <AdminDashboard />
                      </UserRoute>
                    } />
                    
                    {/* Rota administrativa - apenas para admins */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
                    
                    <Route path="/admin/users" element={
                      <HighSecurityRoute>
                        <UserManagement />
                      </HighSecurityRoute>
                    } />
                    
                    <Route path="/login" element={<Login />} />
                    
                    {/* Catch-all para rotas não encontradas */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
              
              <footer className="bg-white shadow-md mt-4">
                <div className="container mx-auto px-4 py-6">
                  {/* Informações do Corretor */}
                  <div className="flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0 md:space-x-8">
                    <div className="text-center">
                      <p className="font-semibold text-gray-800">João Marcelo Ribeiro</p>
                      <p className="text-sm text-gray-600">CRECI MG36453</p>
                    </div>
                    <div className="text-center">
                      <a 
                        href="https://wa.me/5537999420051?text=Olá! Tenho interesse em um imóvel que vi no site Aluga Escarpas. Poderia me ajudar?"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md group"
                      >
                        <svg className="w-4 h-4 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                        </svg>
                        <span className="font-medium">37-999420051</span>
                      </a>
                    </div>
                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                      <a 
                        href="https://instagram.com/escarpas_casas" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg group border border-blue-200"
                      >
                        <svg className="w-4 h-4 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span className="font-medium">@escarpas_casas</span>
                      </a>
                      <a 
                        href="https://instagram.com/joaoribeirobrk" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg group border border-blue-200"
                      >
                        <svg className="w-4 h-4 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span className="font-medium">@joaoribeirobrk</span>
                      </a>
                    </div>
                  </div>
                  
                  {/* Logo e Copyright na parte de baixo */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                      {/* Logo no rodapé */}
                      <div className="">
                        <img 
                          src="/Logo-JM 2.webp" 
                          alt="Logo JM" 
                          className="h-10 w-auto object-contain"
                          onContextMenu={(e) => e.preventDefault()}
                          draggable={false}
                        />
                      </div>
                      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
                        <div className="text-center">
                          <p className="text-gray-600">
                            © 2025 Aluga Escarpas. Todos os direitos reservados.
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            Desenvolvido por LF System
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>

              <Toaster 
                position="top-left"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;