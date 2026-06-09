import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Configuração do Vite. As variáveis VITE_* do .env são expostas ao front
// automaticamente pelo Vite (import.meta.env.VITE_SUPABASE_URL etc.).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Espelha o `paths` do tsconfig: "@/..." -> "src/..."
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
