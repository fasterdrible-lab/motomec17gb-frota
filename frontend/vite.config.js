import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isCapacitor = env.VITE_BUILD_TARGET === 'capacitor'

  return {
    plugins: [react()],
    base: isCapacitor ? '/' : '/motomec17gb-frota/',
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'https://motomec17gb-frota.com.br',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      outDir: isCapacitor ? 'dist-capacitor' : 'dist',
    },
  }
})
