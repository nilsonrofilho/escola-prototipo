// ============================================================================
// ChartView.tsx — renderiza um gráfico gerado pela IA (barras / pizza / linha).
// SVG/CSS puro, sem bibliotecas. Recebe a GraficoSpec retornada pelo backend.
// ============================================================================
import type { GraficoSpec } from '@/services/chatService'

// Paleta fixa para fatias/barras.
const CORES = ['#0a1a4f', '#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ChartView({ spec }: { spec: GraficoSpec }) {
  const dados = spec.dados ?? []
  if (dados.length === 0) {
    return <p className="text-xs text-slate-400">Sem dados para o gráfico.</p>
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-slate-700">{spec.titulo}</p>
      {spec.tipo === 'pizza' ? (
        <Pizza dados={dados} />
      ) : spec.tipo === 'linha' ? (
        <Linha dados={dados} />
      ) : (
        <Barras dados={dados} />
      )}
    </div>
  )
}

// --- Barras horizontais ------------------------------------------------------
function Barras({ dados }: { dados: GraficoSpec['dados'] }) {
  const max = Math.max(1, ...dados.map((d) => d.valor))
  return (
    <div className="space-y-1.5">
      {dados.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-24 shrink-0 truncate text-right text-[11px] text-slate-500" title={d.rotulo}>
            {d.rotulo}
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
            <div
              className="h-full rounded"
              style={{ width: `${(d.valor / max) * 100}%`, backgroundColor: CORES[i % CORES.length] }}
            />
          </div>
          <span className="w-7 text-xs font-semibold text-slate-700">{d.valor}</span>
        </div>
      ))}
    </div>
  )
}

// --- Pizza (donut) -----------------------------------------------------------
function Pizza({ dados }: { dados: GraficoSpec['dados'] }) {
  const total = dados.reduce((s, d) => s + d.valor, 0)
  const raio = 50
  const circ = 2 * Math.PI * raio
  let offset = 0
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 130 130" className="h-32 w-32 -rotate-90">
        <circle cx="65" cy="65" r={raio} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {total > 0 &&
          dados.map((d, i) => {
            const frac = d.valor / total
            const dash = frac * circ
            const el = (
              <circle
                key={i}
                cx="65"
                cy="65"
                r={raio}
                fill="none"
                stroke={CORES[i % CORES.length]}
                strokeWidth="16"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return el
          })}
      </svg>
      <div className="space-y-1">
        {dados.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CORES[i % CORES.length] }} />
            <span className="text-slate-600">{d.rotulo}</span>
            <span className="font-semibold text-slate-800">{d.valor}</span>
            <span className="text-slate-400">({total ? Math.round((d.valor / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Linha -------------------------------------------------------------------
function Linha({ dados }: { dados: GraficoSpec['dados'] }) {
  const max = Math.max(1, ...dados.map((d) => d.valor))
  const w = 280
  const h = 120
  const pad = 24
  const passo = dados.length > 1 ? (w - pad * 2) / (dados.length - 1) : 0
  const pontos = dados.map((d, i) => {
    const x = pad + i * passo
    const y = h - pad - (d.valor / max) * (h - pad * 2)
    return { x, y, ...d }
  })
  const path = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* eixo base */}
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e8f0" />
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" />
      {pontos.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#2563eb" />
          <text x={p.x} y={h - pad + 12} textAnchor="middle" className="fill-slate-400 text-[8px]">
            {p.rotulo}
          </text>
        </g>
      ))}
    </svg>
  )
}
