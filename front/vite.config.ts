import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget =
  process.env.VITE_DEV_PROXY_TARGET ?? 'http://backend:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
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
