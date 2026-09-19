import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    // The renderer only needs Theme Studio's in-memory CSS parser. Keep the
    // full PostCSS entry (and its optional Node file/source-map modules) on
    // the Electron/script side even if a future renderer file imports it.
    alias: [
      {
        find: /^postcss$/,
        replacement: resolve(__dirname, 'src/theme/postcssBrowser.js'),
      },
    ],
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
    outDir: 'dist',
    rollupOptions: {
      // Two entries: the workspace window and the transparent briizy overlay.
      // The overlay is a separate document so it can stay tiny and keep a much
      // tighter CSP than the main app, which has to allow embedded content.
      input: {
        main: resolve(__dirname, 'index.html'),
        briizy: resolve(__dirname, 'briizy.html'),
      },
    },
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
