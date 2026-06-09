// ============================================================================
// App.tsx — roteamento + guarda de autenticação.
// Sem sessão -> LoginPage. Com sessão -> Dashboard / detalhe do lead.
// ============================================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LeadDetailPage } from '@/pages/LeadDetailPage'

// Decide o que renderizar com base na sessão.
function Rotas() {
  const { session, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Carregando…
      </div>
    )
  }

  // Não autenticado: só a tela de login.
  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  // Autenticado.
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/lead/:id" element={<LeadDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Rotas />
      </AuthProvider>
    </BrowserRouter>
  )
}
