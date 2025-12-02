import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Changed from './' to '/' for proper routing on Vercel
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    // This allows the code to access process.env.API_KEY during the build/runtime
    'process.env': process.env
  }
});