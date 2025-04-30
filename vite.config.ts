import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *",
    },
    hmr: {
      clientPort: 12000,
      protocol: 'ws',
    },
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: ['work-1-fikjpgenutfbjuqe.prod-runtime.all-hands.dev', 'work-2-fikjpgenutfbjuqe.prod-runtime.all-hands.dev'],
  },
});