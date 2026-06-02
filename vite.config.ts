import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: '/sofia-initializr/',
  resolve: {
    alias: {
      fs: resolve(__dirname, 'src/shims/fs.ts'),
      path: resolve(__dirname, 'src/shims/path.ts'),
    },
  },
})
