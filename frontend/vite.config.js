import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configures the Vite development server and loads the React plugin
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
