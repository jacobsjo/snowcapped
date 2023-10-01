import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' assert { type: 'json'}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dts()],
  publicDir: false,
  build: {
    lib: {
      entry: './src/main/index.ts',
      name: 'Snowcapped CLI',
      fileName: 'snowcapped',
      formats: ['es'],
    },
    outDir: 'dist-api',
    rollupOptions: {
      external: [
        ... Object.keys(pkg.dependencies),
      ]
    },
    target: 'esnext',
  },
})
