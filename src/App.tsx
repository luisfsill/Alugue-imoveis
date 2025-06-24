import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute, UserRoute, HighSecurityRoute } from './guards';
import { CORSMiddleware } from './utils/corsMiddleware';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';

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
              </main>
              
              <footer className="bg-white shadow-md mt-4">
                <div className="container mx-auto px-4 py-6">
                  <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                    {/* Logo no rodapé */}
                    <div className="">
                      <img 
                        src="/Logo JM 2.png" 
                        alt="Logo JM" 
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8">
                      <div className="text-center">
                        <p className="text-gray-600">
                          © {new Date().getFullYear()} Alugue Imóveis. Todos os direitos reservados.
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