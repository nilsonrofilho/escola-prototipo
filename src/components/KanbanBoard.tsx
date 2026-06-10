// ============================================================================
// KanbanBoard.tsx — quadro estilo CRM. Uma coluna por etapa do funil.
// Arrastar um card para outra coluna muda o status_funil do lead.
// Drag-and-drop nativo do HTML5 (sem dependências externas).
// Cada card tem uma "alça" (⠿) que deixa claro que é arrastável.
// ============================================================================
import { useMemo, useState } from 'react'
import type { Lead, StatusFunil } from '@/lib/types'
import { FUNIL_ORDEM, STATUS_LABELS } from '@/lib/types'
import { ScoreBadge } from '@/components/ScoreBadge'
import { TagBadge } from '@/components/TagBadge'

interface Props {
  leads: Lead[]
  onAbrir: (id: string) => void
  onMudarStatus: (id: string, status: StatusFunil) => void
  onArquivar: (id: string, arquivado: boolean) => void
}

// Classes literais por coluna (Tailwind precisa de strings completas — nada de
// interpolação dinâmica, senão o JIT não gera o CSS).
const COLUNA_ESTILO: Record<StatusFunil, { borda: string; cabecalho: string; ponto: string }> = {
  novo: { borda: 'border-t-slate-400', cabecalho: 'text-slate-600', ponto: 'bg-slate-400' },
  contato_feito: { borda: 'border-t-sky-400', cabecalho: 'text-sky-600', ponto: 'bg-sky-400' },
  reuniao_agendada: { borda: 'border-t-violet-400', cabecalho: 'text-violet-600', ponto: 'bg-violet-400' },
  proposta_enviada: { borda: 'border-t-amber-400', cabecalho: 'text-amber-600', ponto: 'bg-amber-400' },
  ganho: { borda: 'border-t-emerald-500', cabecalho: 'text-emerald-600', ponto: 'bg-emerald-500' },
  perdido: { borda: 'border-t-rose-400', cabecalho: 'text-rose-600', ponto: 'bg-rose-400' },
}

export function KanbanBoard({ leads, onAbrir, onMudarStatus, onArquivar }: Props) {
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [sobreColuna, setSobreColuna] = useState<StatusFunil | null>(null)

  // Agrupa os leads por etapa.
  const colunas = useMemo(() => {
    const mapa: Record<StatusFunil, Lead[]> = {
      novo: [],
      contato_feito: [],
      reuniao_agendada: [],
      proposta_enviada: [],
      ganho: [],
      perdido: [],
    }
    for (const l of leads) mapa[l.status_funil].push(l)
    return mapa
  }, [leads])

  function soltar(status: StatusFunil) {
    if (arrastando) {
      const lead = leads.find((l) => l.id === arrastando)
      if (lead && lead.status_funil !== status) {
        onMudarStatus(arrastando, status)
      }
    }
    setArrastando(null)
    setSobreColuna(null)
  }

  return (
    <div>
      <p className="mb-3 text-xs text-slate-400">
        Dica: arraste os cards pela alça <span className="font-bold">⠿</span> para mover entre as
        etapas.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {FUNIL_ORDEM.map((status) => {
          const estilo = COLUNA_ESTILO[status]
          const cards = colunas[status]
          const ativa = sobreColuna === status
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault()
                setSobreColuna(status)
              }}
              onDragLeave={() => setSobreColuna((s) => (s === status ? null : s))}
              onDrop={() => soltar(status)}
              className={`flex w-72 shrink-0 flex-col rounded-lg border-t-4 bg-slate-100/70 ${estilo.borda} ${
                ativa ? 'ring-2 ring-inter/40' : ''
              }`}
            >
              {/* Cabeçalho da coluna */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${estilo.ponto}`} />
                  <span className={`text-sm font-semibold ${estilo.cabecalho}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 px-2 pb-3">
                {cards.length === 0 && (
                  <div
                    className={`rounded-md border border-dashed py-6 text-center text-xs ${
                      ativa ? 'border-inter/50 bg-inter/5 text-inter' : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    {ativa ? 'Solte aqui' : 'Arraste leads para cá'}
                  </div>
                )}
                {cards.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      setArrastando(lead.id)
                      // necessário p/ o drag funcionar em Firefox
                      e.dataTransfer.setData('text/plain', lead.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => {
                      setArrastando(null)
                      setSobreColuna(null)
                    }}
                    className={`group rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:shadow ${
                      arrastando === lead.id ? 'rotate-1 opacity-50' : ''
                    } ${lead.arquivado ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Alça de arraste */}
                      <span
                        className="mt-0.5 cursor-grab select-none text-slate-300 active:cursor-grabbing"
                        title="Arraste para mover"
                        aria-hidden
                      >
                        ⠿
                      </span>
                      <button
                        onClick={() => onAbrir(lead.id)}
                        className="flex-1 text-left text-sm font-semibold leading-tight text-slate-800 hover:text-inter"
                      >
                        {lead.nome_instituicao}
                      </button>
                      <ScoreBadge faixa={lead.faixa} score={lead.score} />
                    </div>
                    {lead.cidade && <p className="mt-1 pl-5 text-xs text-slate-400">{lead.cidade}</p>}
                    {lead.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 pl-5">
                        {lead.tags.map((t) => (
                          <TagBadge key={t} tag={t} />
                        ))}
                      </div>
                    )}
                    {/* Ações que aparecem ao passar o mouse */}
                    <div className="mt-2 flex justify-end pl-5 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => onArquivar(lead.id, !lead.arquivado)}
                        className="text-[11px] text-slate-400 hover:text-slate-700"
                      >
                        {lead.arquivado ? 'Desarquivar' : 'Arquivar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
