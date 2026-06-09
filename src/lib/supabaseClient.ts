// ============================================================================
// supabaseClient.ts — cliente único do Supabase.
// Lê as credenciais do .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
// NUNCA hardcode as chaves aqui.
// ============================================================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Aviso claro no console se o .env não estiver configurado.
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    '[Supabase] Variáveis de ambiente ausentes. ' +
      'Crie um arquivo .env na raiz com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ' +
      '(veja o .env.example e o README).',
  )
}

// Em dev, se faltar config, usamos strings vazias para não quebrar o import —
// o app mostra a tela de login e o erro fica visível no console.
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

// Flag útil para a UI avisar o usuário sobre .env não configurado.
export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey)
