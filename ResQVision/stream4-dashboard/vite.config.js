import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const stream3Target = env.VITE_STREAM3_BASE_URL || 'http://localhost:8003';
  const layer3Target = env.VITE_LAYER3_API_URL || 'http://127.0.0.1:8004';

  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 1100,
      rollupOptions: {
        output: {
          manualChunks: {
            maplibre: ['maplibre-gl'],
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['swr', 'lucide-react']
          }
        }
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api/v1': {
          target: layer3Target,
          changeOrigin: true,
          secure: false
        },
        '/api': {
          target: stream3Target,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
