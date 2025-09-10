import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from "path";

export default defineConfig({
  publicDir: '../public',
  plugins: [dts({
      insertTypesEntry: true,
      rollupTypes: true,
    })],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: 'wm-sim',
      fileName: (format) => `wm-sim.${format}.js`
    },
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['../tests/**/*.test.ts', './**/*.test.ts'],
    coverage: {
      include: [
        'src/**/*.ts',
      ]
    }
  },
  worker: {
    format: 'es'
  },
});