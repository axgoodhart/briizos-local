import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      'react-reconciler',
      'scheduler',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-reconciler',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['.'],
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
