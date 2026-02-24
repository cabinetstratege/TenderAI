import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-router-dom",
        "@google/genai",
        "lucide-react",
        "recharts",
        "jspdf",
        "@supabase/supabase-js",
        "mapbox-gl",
        "react-map-gl/mapbox",
      ],
    },
  },
  define: {
    // SAFELY inject API keys.
    "process.env.GEMINI_KEY": JSON.stringify(process.env.GEMINI_KEY),
    "process.env.MAPBOX_PUBLIC_KEY": JSON.stringify(
      "pk.eyJ1IjoiY29saW5qYW1pZXIiLCJhIjoiY21qNXFsYWdwMWZ0bTNlczRzZjdmdDlqaSJ9.yBVFtX-LUyb-1x_LD_LbTw",
    ),
  },
});
