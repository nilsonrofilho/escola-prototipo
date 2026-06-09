// ============================================================================
// DashboardView.tsx — visão gerencial visual do pipeline.
// Gráficos feitos com CSS/SVG puro (sem bibliotecas externas).
//   - Cards de resumo (total, quentes, ganhos, taxa de conversão)
//   - Distribuição por faixa (barras)
//   - Funil por etapa (barras horizontais proporcionais)
//   - Top tags
// ============================================================================
import { useMemo } from 'react'
import type { Lead, Faixa, StatusFunil } from '@/lib/types'
import { FAIXA_LABELS, FUNIL_ORDEM, STATUS_LABELS, corDaTag } from '@/lib/types'

interface Props {
  leads: Lead[]
}

// Cores literais por faixa (donut + barras).
const FAIXA_BG: Record<Faixa, string> = {
  quente: 'bg-red-500',
  morno: 'bg-amber-500',
  frio: 'bg-blue-500',
}
const FAIXA_HEX: Record<Faixa, string> = {
  quente: '#ef4444',
  morno: '#f59e0b',
  frio: '#3b82f6',
}

// Largura proporcional por etapa do funil.
const FUNIL_BG: Record<StatusFunil, string> = {
  novo: 'bg-slate-400',
  contato_feito: 'bg-sky-400',
  reuniao_agendada: 'bg-violet-400',
  proposta_enviada: 'bg-amber-400',
  ganho: 'bg-emerald-500',
  perdido: 'bg-rose-400',
}

function Card({ titulo, valor, sub }: { titulo: string; valor: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{valor}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

// Donut SVG simples para a distribuição por faixa.
function Donut({ dados, total }: { dados: { faixa: Faixa; n: number }[]; total: number }) {
  const raio = 54
  const circ = 2 * Math.PI * raio
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
        <circle cx="70" cy="70" r={raio} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {total > 0 &&
          dados.map(({ faixa, n }) => {
            const frac = n / total
            const dash = frac * circ
            const el = (
              <circle
                key={faixa}
                cx="70"
                cy="70"
                r={raio}
                fill="none"
                stroke={FAIXA_HEX[faixa]}
                strokeWidth="16"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return el
          })}
      </svg>
      <div className="space-y-1.5">
        {dados.map(({ faixa, n }) => (
          <div key={faixa} className="flex items-center gap-2 text-sm">
            <span className={`h-3 w-3 rounded-sm ${FAIXA_BG[faixa]}`} />
            <span className="text-slate-600">{FAIXA_LABELS[faixa]}</span>
            <span className="font-semibold text-slate-800">{n}</span>
            <span className="text-xs text-slate-400">
              ({total ? Math.round((n / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardView({ leads }: Props) {
  const stats = useMemo(() => {
    const total = leads.length
    const porFaixa: Record<Faixa, number> = { quente: 0, morno: 0, frio: 0 }
    const porStatus: Record<StatusFunil, number> = {
      novo: 0,
      contato_feito: 0,
      reuniao_agendada: 0,
      proposta_enviada: 0,
      ganho: 0,
      perdido: 0,
    }
    const tagCount = new Map<string, number>()

    for (const l of leads) {
      porFaixa[l.faixa]++
      porStatus[l.status_funil]++
      for (const t of l.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
    }

    const fechados = porStatus.ganho + porStatus.perdido
    const conversao = fechados > 0 ? Math.round((porStatus.ganho / fechados) * 100) : 0
    const topTags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)

    return { total, porFaixa, porStatus, conversao, topTags }
  }, [leads])

  const maxStatus = Math.max(1, ...FUNIL_ORDEM.map((s) => stats.porStatus[s]))

  return (
    <div className="space-y-5">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card titulo="Total de leads" valor={stats.total} />
        <Card titulo="Quentes" valor={stats.porFaixa.quente} sub="prioridade de abordagem" />
        <Card titulo="Ganhos" valor={stats.porStatus.ganho} sub="licenças fechadas" />
        <Card titulo="Conversão" valor={`${stats.conversao}%`} sub="ganhos ÷ fechados" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Distribuição por faixa */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Distribuição por faixa</h3>
          <Donut
            total={stats.total}
            dados={[
              { faixa: 'quente', n: stats.porFaixa.quente },
              { faixa: 'morno', n: stats.porFaixa.morno },
              { faixa: 'frio', n: stats.porFaixa.frio },
            ]}
          />
        </div>

        {/* Funil por etapa */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Leads por etapa do funil</h3>
          <div className="space-y-2.5">
            {FUNIL_ORDEM.map((status) => {
              const n = stats.porStatus[status]
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-right text-xs text-slate-500">
                    {STATUS_LABELS[status]}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className={`h-full rounded ${FUNIL_BG[status]}`}
                      style={{ width: `${(n / maxStatus) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-sm font-semibold text-slate-700">{n}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top tags */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Tags mais usadas</h3>
        {stats.topTags.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma tag ainda. Adicione tags aos leads.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(([tag, n]) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${corDaTag(tag)}`}
              >
                {tag}
                <span className="opacity-60">· {n}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
