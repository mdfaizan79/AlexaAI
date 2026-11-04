import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alexa AI owns port 5273 for dev (517x is shared with other dev servers).
// The backend port can be overridden with ALEXA_PORT, default 8000.
const BACKEND = `http://localhost:${process.env.ALEXA_PORT || 8000}`

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    strictPort: true,
    proxy: {
      '/ws': { target: `ws://localhost:${process.env.ALEXA_PORT || 8000}`, ws: true },
      '/api': BACKEND,
    },
  },
})
