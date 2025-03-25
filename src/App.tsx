import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="container mx-auto px-4 py-6 flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:id" element={<PropertyDetails />} />
              <Route path="/admin" element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin/users" element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              } />
              <Route path="/login" element={<Login />} />
              {/* Catch-all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <footer className="bg-white shadow-md mt-12">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
                <div className="text-center">
                  <p className="text-gray-600">
                    © {new Date().getFullYear()} Alugue Escarpas. Todos os direitos reservados.
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Desenvolvido por LF System
                  </p>
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
      </AuthProvider>
    </Router>
  );
}

export default App;