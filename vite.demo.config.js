import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  publicDir: '../public',
  plugins: [],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'wm-sim',
      fileName: (format) => `wm-sim.${format}.js`
    },
    outDir: '../dist-demo'
  },
});