import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  base: '/',
  plugins: [tailwindcss()],
  esbuild: { jsx: 'automatic' },
  build: {
    outDir: '../dist/site',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        labs: resolve(root, 'index.html'),
        design: resolve(root, 'design/index.html'),
        docs: resolve(root, 'design/docs/index.html'),
      },
    },
  },
});
