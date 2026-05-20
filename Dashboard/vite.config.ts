import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // Load env so the proxy target reflects VITE_CHAT_SERVICE_URL if set.
  const env = loadEnv(mode, process.cwd(), '');
  const chatTarget = (env.VITE_CHAT_SERVICE_URL ?? 'http://localhost:3004')
    .trim()
    .replace(/\/+$/, '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@features': path.resolve(__dirname, './src/features'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    server: {
      proxy: {
        // All chat-service HTTP calls go through this proxy in dev.
        // This avoids CORS preflight failures for methods like PATCH.
        // The wallSocket still connects directly (WebSocket is unaffected).
        '/chat-proxy': {
          target: chatTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/chat-proxy/, ''),
        },
      },
    },
  };
});
