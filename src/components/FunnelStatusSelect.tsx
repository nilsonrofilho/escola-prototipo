// ============================================================================
// FunnelStatusSelect.tsx — dropdown para mudar o status do funil de um lead.
// ============================================================================
import type { StatusFunil } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

const ORDEM: StatusFunil[] = [
  'novo',
  'contato_feito',
  'reuniao_agendada',
  'proposta_enviada',
  'ganho',
  'perdido',
]

interface Props {
  valor: StatusFunil
  onChange: (status: StatusFunil) => void
  disabled?: boolean
}

export function FunnelStatusSelect({ valor, onChange, disabled }: Props) {
  return (
    <select
      value={valor}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StatusFunil)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter disabled:opacity-50"
    >
      {ORDEM.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
