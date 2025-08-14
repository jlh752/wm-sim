import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  publicDir: '../public',
  plugins: [],
  build: {
    lib: {
      entry: 'app/index.ts',
      name: 'wm-sim',
      fileName: (format) => `wm-sim.${format}.js`
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});