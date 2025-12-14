
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
    // SAFELY inject API keys.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.MAPBOX_PUBLIC_KEY': JSON.stringify("pk.eyJ1IjoiY29saW5qYW1pZXIiLCJhIjoiY21qNXFsYWdwMWZ0bTNlczRzZjdmdDlqaSJ9.yBVFtX-LUyb-1x_LD_LbTw")
  }
});