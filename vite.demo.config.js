import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  publicDir: '../public',
  base: "./",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  }
});