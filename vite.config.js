import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, the React app runs on :5173 and the Node API on :3001.
// Proxy /api to the backend so the browser calls it same-origin.
// In production, the same Node server serves both the built site and /api.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: {
      '/api': `http://127.0.0.1:${process.env.PORT || loadEnv(mode, process.cwd(), '').PORT || 3001}`,
    },
  },
}))
