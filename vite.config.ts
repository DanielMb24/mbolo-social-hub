import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          "react-core": ["react", "react-dom", "react-router-dom"],
          "ui-radix": [
            "@radix-ui/react-dialog", 
            "@radix-ui/react-dropdown-menu", 
            "@radix-ui/react-tooltip",
            "@radix-ui/react-avatar",
            "@radix-ui/react-tabs"
          ],
          "query": ["@tanstack/react-query"],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    sourcemap: mode === 'development',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
