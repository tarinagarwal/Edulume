import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_URL?.replace("/api", "") ||
          "http://localhost:3001",
        changeOrigin: true,
        //@ts-ignore
        credentials: true,
      },
    },
  },
  define: {
    "process.env": process.env,
  },
});
