import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {                          
    host: true,
    port: 5173,
    allowedHosts: ['cake-web.cl'],
  },

  test: {                            
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.js'],
  },
})