import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/motomec17gb-frota/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
})
