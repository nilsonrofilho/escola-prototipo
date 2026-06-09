// ============================================================================
// AuthContext.tsx — estado global de autenticação (Supabase Auth email/senha).
// ============================================================================
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextValue {
  session: Session | null
  user: User | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<{ error: string | null }>
  cadastrar: (email: string, senha: string) => Promise<{ error: string | null; precisaConfirmar: boolean }>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Sessão inicial (caso o usuário já esteja logado)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })

    // Escuta mudanças de login/logout
    const { data: sub } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function entrar(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    return { error: error ? traduzirErro(error.message) : null }
  }

  async function cadastrar(email: string, senha: string) {
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) return { error: traduzirErro(error.message), precisaConfirmar: false }
    // Se "Confirm email" estiver ligado no Supabase, não há sessão imediata.
    const precisaConfirmar = !data.session
    return { error: null, precisaConfirmar }
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, carregando, entrar, cadastrar, sair }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook de acesso ao contexto.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}

// Traduz as mensagens mais comuns do Supabase para PT-BR.
function traduzirErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('user already registered')) return 'Este e-mail já está cadastrado. Faça login.'
  if (m.includes('password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.'
  if (m.includes('unable to validate email')) return 'E-mail inválido.'
  return msg
}
