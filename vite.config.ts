import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          supabase: ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
          utils: ['js-sha256', 'dompurify']
        }
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: 'localhost',
    cors: {
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        // Adicione aqui seus domínios de desenvolvimento
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'apikey',
        'X-Client-Info',
        'X-Security-Version',
        'X-Environment'
      ],
      credentials: true
    }
  },
  preview: {
    port: 5173,
    host: true,
  },
});