import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  publicDir: '../public',
  plugins: [dts({
      insertTypesEntry: true,
      rollupTypes: true,
    })],
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
    include: ['../tests/**/*.test.ts', './**/*.test.ts'],
  },
  worker: {
    format: 'es'
  },
});