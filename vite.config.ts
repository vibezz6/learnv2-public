import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: "127.0.0.1",
    strictPort: true,
  },
  preview: {
    port: 8080,
    host: "127.0.0.1",
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("katex")) return "vendor-katex";
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/react/")
          ) {
            return "vendor-react";
          }
          if (id.includes("lucide-react")) return "vendor-icons";
          return "vendor-misc";
        },
      },
    },
  },
});
