import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
  preview: { host: true, port: 4173, allowedHosts: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          livekit: [
            'livekit-client',
            '@livekit/components-react',
            '@livekit/components-styles',
          ],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          markdown: ['react-markdown', 'remark-gfm', 'remark-breaks'],
        },
      },
    },
  },
});
