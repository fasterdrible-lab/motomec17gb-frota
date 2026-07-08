import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// O Capacitor serve o build local via interceptacao (shouldInterceptRequest) sob o
// hostname configurado em capacitor.config.json. Scripts de modulo com o atributo
// "crossorigin" (padrao do Vite) sao buscados em modo CORS estrito e falham
// silenciosamente nesse contexto interceptado, deixando a tela em branco sem
// nenhum erro no console. Remove o atributo apenas no build do Capacitor.
function stripCrossoriginForCapacitor() {
  return {
    name: 'strip-crossorigin-for-capacitor',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(="[^"]*")?/g, '')
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isCapacitor = env.VITE_BUILD_TARGET === 'capacitor'

  return {
    plugins: [react(), ...(isCapacitor ? [stripCrossoriginForCapacitor()] : [])],
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
