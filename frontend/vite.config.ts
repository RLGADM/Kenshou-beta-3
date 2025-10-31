import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// --------------------------------------------------
// ⚙️ Configuration Vite complète (frontend Kensho)
// --------------------------------------------------
export default defineConfig({
  plugins: [react()],

  // ✅ Résolution des chemins alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },

  // ✅ Configuration du serveur local de développement
  server: {
    port: 5173, // Port par défaut du frontend Vite
    strictPort: true, // Évite qu’il bascule sur un autre port
    cors: {
      origin: ['http://localhost:3000'], // autorise ton backend local
      credentials: true,
    },
    open: true, // Ouvre le navigateur automatiquement
  },
});
