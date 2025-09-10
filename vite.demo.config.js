import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  publicDir: '../public',
  base: "./",
  build: {
    outDir: "./dist-demo",
    emptyOutDir: true,
  }
});