import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: '/',
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