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
    host: true,
    proxy: {
      '/api': 'http://localhost:3000'
    },
    middleware: async () => {
      return [
        (req, res, next) => {
          // Serve index.html for all non-asset routes
          if (!req.url.includes('.')) {
            req.url = '/';
          }
          next();
        }
      ];
    }
  },
  preview: {
    port: 5173,
    host: true,
  },
});