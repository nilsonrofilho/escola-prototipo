// ============================================================================
// ActivityTimeline.tsx — timeline/feed de atividades.
// Usada no detalhe do lead (eventos daquele lead) e no Dashboard (feed geral).
// ============================================================================
import type { Activity, TipoAtividade } from '@/lib/types'

// Ponto colorido + ícone por tipo de atividade.
const ESTILO: Record<TipoAtividade, { ponto: string; icone: string }> = {
  criado: { ponto: 'bg-emerald-500', icone: '＋' },
  status: { ponto: 'bg-sky-500', icone: '→' },
  arquivado: { ponto: 'bg-slate-400', icone: '📦' },
  desarquivado: { ponto: 'bg-amber-500', icone: '↩' },
  faixa: { ponto: 'bg-violet-500', icone: '★' },
}

// Formata a data de forma amigável (relativa para recente, absoluta depois).
function quando(iso: string): string {
  const d = new Date(iso)
  const agora = new Date()
  const diffMin = Math.round((agora.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `há ${diffH} h`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  atividades: Activity[]
  mostrarLead?: boolean // mostra o nome da instituição (feed geral)
  vazioMsg?: string
}

export function ActivityTimeline({ atividades, mostrarLead = false, vazioMsg }: Props) {
  if (atividades.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        {vazioMsg ?? 'Nenhuma atividade registrada ainda.'}
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {atividades.map((a) => {
        const e = ESTILO[a.tipo]
        return (
          <li key={a.id} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] text-white ${e.ponto}`}
              aria-hidden
            >
              {e.icone}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-700">
                {mostrarLead && a.lead_nome && (
                  <span className="font-semibold text-slate-800">{a.lead_nome}: </span>
                )}
                {a.descricao}
              </p>
              <p className="text-xs text-slate-400">{quando(a.created_at)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
