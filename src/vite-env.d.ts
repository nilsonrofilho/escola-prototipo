/// <reference types="vite/client" />

// Tipagem das variáveis de ambiente VITE_* usadas no projeto.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
