import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const reactBitsPath = path.resolve(__dirname, '../../Libraries/react-bits');

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@reactbits': path.join(reactBitsPath, 'src/ts-default/Backgrounds'),
    },
  },
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['.', reactBitsPath],
    },
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
