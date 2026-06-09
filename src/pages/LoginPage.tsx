// ============================================================================
// LoginPage.tsx — login e cadastro por e-mail/senha (Supabase Auth).
// ============================================================================
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabaseConfigurado } from '@/lib/supabaseClient'

export function LoginPage() {
  const { entrar, cadastrar } = useAuth()
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setCarregando(true)
    try {
      if (modo === 'login') {
        const { error } = await entrar(email, senha)
        if (error) setMsg(error)
      } else {
        const { error, precisaConfirmar } = await cadastrar(email, senha)
        if (error) setMsg(error)
        else if (precisaConfirmar)
          setMsg('Conta criada! Verifique seu e-mail para confirmar antes de entrar.')
        else setMsg('Conta criada e logado!')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-inter text-lg font-black text-white">
            EI
          </div>
          <h1 className="text-xl font-bold text-slate-800">Escolinha Inter</h1>
          <p className="text-sm text-slate-500">Pré-qualificação de leads</p>
        </div>

        {!supabaseConfigurado && (
          <div className="mb-4 rounded-md bg-amber-50 p-3 text-xs text-amber-700 ring-1 ring-amber-200">
            ⚠ Supabase não configurado. Preencha o arquivo <code>.env</code> com
            <code> VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> e reinicie o
            <code> npm run dev</code>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
            />
          </div>

          {msg && <p className="text-sm text-slate-600">{msg}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-inter py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {carregando ? 'Aguarde…' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          onClick={() => {
            setModo(modo === 'login' ? 'cadastro' : 'login')
            setMsg(null)
          }}
          className="mt-4 w-full text-center text-xs text-inter hover:underline"
        >
          {modo === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
