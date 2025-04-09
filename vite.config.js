import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    resolve: { dedupe: ['react', 'react-dom'] },
    optimizeDeps: { include: ['react', 'react-dom'] },
    ...(command === 'serve' && {
      server: {
        watch: { usePolling: true },
        host: 'localhost',
        strictPort: true,
        port: 3006,
        proxy: {
          '/api': {
            target: 'http://localhost:8080', // <-- now points to backend on 8080
            changeOrigin: true,
            rewrite: path => path.replace(/^\/api/, ''),
          },
        },
        allowedHosts: ['localhost'],
      },
    }),
  }
})
