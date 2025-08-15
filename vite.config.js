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
    include: ['test/**/*.test.ts', 'demo/**/*.test.ts'],
  },
  worker: {
    format: 'es'
  },
});