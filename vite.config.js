import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, the React app runs on :5173 and the Node API on :3001.
// Proxy /api to the backend so the browser calls it same-origin.
// In production, the same Node server serves both the built site and /api.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
