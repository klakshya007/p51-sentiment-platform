import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://sentiment-api.kindpond-fa4065cb.centralindia.azurecontainerapps.io",
        changeOrigin: true,
      },
    },
  },
});
