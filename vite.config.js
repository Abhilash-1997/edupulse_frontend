import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      global: "window",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    // // ✅ ADD THIS PART in development
    // server: {
    //   proxy: {
    //     '/api': {
    //       target: 'http://localhost:8080', // Spring Boot port
    //       changeOrigin: true,
    //       secure: false,
    //     }
    //   }
    // }

  };
});