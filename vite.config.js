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
    sourcemap: true,  // Для дебаггинга в продакшене
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Используем относительные пути для ресурсов
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  // Для MAX Bridge важно:
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  // ВАЖНО: Если приложение развернуто НЕ в корне домена, измените base:
  // Например, если приложение в подпапке /app/, используйте: base: '/app/'
  // Для корня домена оставьте: base: '/'
  base: '/'
})