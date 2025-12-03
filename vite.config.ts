import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    // SAFELY inject only the API_KEY. 
    // Do NOT overwrite the whole process.env object, as it breaks React.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});