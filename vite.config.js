import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
    host: true, // needed for the Docker Container port mapping to work
    strictPort: true,
    port: 3006, // you can replace this port with any port
    proxy:{
      target: 'http://localhost:3005',
      changeOrigin: true,
      rewritePath: path=>path.replace(/^\/api/, ''),
    }
  }
})