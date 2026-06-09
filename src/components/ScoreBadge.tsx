// ============================================================================
// ScoreBadge.tsx — selo da faixa (Quente / Morno / Frio) + score.
// Visual sóbrio: ponto colorido em vez de emoji, para cara de produto.
// ============================================================================
import type { Faixa } from '@/lib/types'
import { FAIXA_LABELS } from '@/lib/types'

const ESTILOS: Record<Faixa, string> = {
  quente: 'bg-red-50 text-red-700 ring-red-200',
  morno: 'bg-amber-50 text-amber-700 ring-amber-200',
  frio: 'bg-blue-50 text-blue-700 ring-blue-200',
}

const PONTO: Record<Faixa, string> = {
  quente: 'bg-red-500',
  morno: 'bg-amber-500',
  frio: 'bg-blue-500',
}

export function ScoreBadge({ faixa, score }: { faixa: Faixa; score?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ESTILOS[faixa]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${PONTO[faixa]}`} aria-hidden />
      {FAIXA_LABELS[faixa]}
      {typeof score === 'number' && <span className="font-normal opacity-60">· {score}</span>}
    </span>
  )
}
