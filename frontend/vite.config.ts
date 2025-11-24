import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3247,
  },
  build: {
    chunkSizeWarningLimit: 1500, // Phase 1 MVP: 警告閾値を1500kBに設定（デフォルト500kB）
  },
})
