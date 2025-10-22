import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // 避免在移动端出现加载问题
      },
    },
  },
  server: {
    port: 3000,
  },
  // 确保在 Capacitor 中正常工作
  base: './',
});
