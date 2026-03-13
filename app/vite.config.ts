import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/prices": "http://localhost:3001",
      "/flags": "http://localhost:3001",
    },
  },
})
