// ============================================================================
// Modal.tsx — janela pop-up reutilizável (overlay + ESC + clique fora fecha).
// Usada para criar/editar lead em destaque, sem empurrar o conteúdo da página.
// ============================================================================
import { useEffect, type ReactNode } from 'react'

interface Props {
  aberto: boolean
  onClose: () => void
  titulo: string
  children: ReactNode
  larguraMax?: string // ex.: 'max-w-2xl'
}

export function Modal({ aberto, onClose, titulo, children, larguraMax = 'max-w-2xl' }: Props) {
  // Fecha com a tecla ESC e trava o scroll do body enquanto aberto.
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [aberto, onClose])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`my-8 w-full ${larguraMax} rounded-xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()} // não fecha ao clicar dentro
      >
        {/* Cabeçalho fixo do modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-inter">{titulo}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {/* Conteúdo */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
