import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true  // Доступ с других устройств в сети
  },
  build: {
    outDir: 'dist',
    sourcemap: true  // Для дебаггинга в продакшене
  },
  // Для MAX Bridge важно:
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
})