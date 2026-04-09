import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxyTarget =
  process.env.VITE_DEV_PROXY_TARGET ?? 'http://backend:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    allowedHosts: ['localhost', '127.0.0.1', 'flowrank.tigropoil.fr'],
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: (path) => {
          const stripped = path.replace(/^\/api/, '')
          return stripped === '' ? '/' : stripped
        },
      },
    },
  },
})