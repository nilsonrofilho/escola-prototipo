// ============================================================================
// ScoreConfigPanel.tsx — ajuste dos PESOS e CORTES pela UI (alternativa ao SQL).
// Depois de salvar, oferece recalcular todos os leads.
// ============================================================================
import { useEffect, useState } from 'react'
import type { ScoreConfigRow } from '@/lib/types'
import {
  listarPesos,
  atualizarPeso,
  atualizarCorte,
  carregarScoringConfig,
} from '@/services/scoreConfigService'
import { recalcularTodos } from '@/services/leadsService'

interface Props {
  onFechar: () => void
  onRecalculado?: () => void
}

export function ScoreConfigPanel({ onFechar, onRecalculado }: Props) {
  const [pesos, setPesos] = useState<ScoreConfigRow[]>([])
  const [corteQuente, setCorteQuente] = useState(70)
  const [corteMorno, setCorteMorno] = useState(40)
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listarPesos(), carregarScoringConfig()])
      .then(([linhas, cfg]) => {
        setPesos(linhas)
        setCorteQuente(cfg.corteQuente)
        setCorteMorno(cfg.corteMorno)
      })
      .catch((e) => setMsg(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  const total = pesos.reduce((s, p) => s + p.peso, 0)

  async function salvar() {
    setMsg(null)
    try {
      for (const p of pesos) {
        await atualizarPeso(p.chave, { peso: p.peso })
      }
      await atualizarCorte('corte_quente', corteQuente)
      await atualizarCorte('corte_morno', corteMorno)
      const n = await recalcularTodos()
      setMsg(`Pesos salvos. ${n} lead(s) recalculado(s).`)
      onRecalculado?.()
    } catch (e) {
      setMsg(`Erro ao salvar: ${(e as Error).message}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-inter">Ajustar pesos do scoring</h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {carregando ? (
          <p className="text-slate-400">Carregando…</p>
        ) : (
          <>
            <div className="space-y-2">
              {pesos.map((p, i) => (
                <div key={p.chave} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-slate-700">
                    {p.descricao}
                    {p.eh_gate && (
                      <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">
                        gate
                      </span>
                    )}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={p.peso}
                    onChange={(e) => {
                      const novo = [...pesos]
                      novo[i] = { ...p, peso: Number(e.target.value) || 0 }
                      setPesos(novo)
                    }}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 text-right text-sm text-slate-500">
              Total dos pesos: <strong className={total === 100 ? 'text-green-600' : 'text-amber-600'}>{total}</strong>
              {total !== 100 && ' (recomendado: 100)'}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <label className="text-sm text-slate-700">
                Corte Quente (≥)
                <input
                  type="number"
                  value={corteQuente}
                  onChange={(e) => setCorteQuente(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Corte Morno (≥)
                <input
                  type="number"
                  value={corteMorno}
                  onChange={(e) => setCorteMorno(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
              </label>
            </div>

            {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={salvar}
                className="rounded-md bg-inter px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Salvar e recalcular
              </button>
              <button
                onClick={onFechar}
                className="rounded-md border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
