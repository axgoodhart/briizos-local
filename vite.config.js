import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Prevent backend virtualenv/package churn from triggering Vite full reloads.
      ignored: [
        '**/agent/.venv/**',
        '**/agent/.langgraph_api/**',
        '**/agent/.deer-flow/**',
        '**/agent/**/__pycache__/**',
      ],
    },
  }
});
