import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  esbuild: { jsx: 'automatic' },
  build: { outDir: '../dist/wizard', emptyOutDir: true },
});
