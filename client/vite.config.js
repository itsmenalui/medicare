import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ADDED: This proxy configuration is the fix.
    // It forwards all API requests to your backend server.
    proxy: {
      "/api": {
        target: "http://localhost:5001", // Your backend server's address
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
