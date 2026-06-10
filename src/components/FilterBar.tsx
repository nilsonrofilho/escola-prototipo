// ============================================================================
// FilterBar.tsx — filtros: faixa, status (opcional), busca por texto e tags.
// ============================================================================
import type { Faixa, StatusFunil } from '@/lib/types'
import { FAIXA_LABELS, STATUS_LABELS, corDaTag } from '@/lib/types'

export interface FiltrosUI {
  faixa: Faixa | 'todas'
  status: StatusFunil | 'todos'
  busca: string
  tags: string[] // tags selecionadas para filtrar
  incluirArquivados: boolean // mostrar também leads arquivados
}

interface Props {
  filtros: FiltrosUI
  onChange: (f: FiltrosUI) => void
  tagsDisponiveis?: string[] // chips de tag para clicar/filtrar
  mostrarStatus?: boolean // oculta o filtro de status (ex.: no Kanban)
}

const FAIXAS: (Faixa | 'todas')[] = ['todas', 'quente', 'morno', 'frio']
const STATUSES: (StatusFunil | 'todos')[] = [
  'todos',
  'novo',
  'contato_feito',
  'reuniao_agendada',
  'proposta_enviada',
  'ganho',
  'perdido',
]

export function FilterBar({ filtros, onChange, tagsDisponiveis = [], mostrarStatus = true }: Props) {
  function toggleTag(tag: string) {
    const ativa = filtros.tags.includes(tag)
    onChange({
      ...filtros,
      tags: ativa ? filtros.tags.filter((t) => t !== tag) : [...filtros.tags, tag],
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Buscar</label>
          <input
            type="text"
            placeholder="Instituição ou cidade…"
            value={filtros.busca}
            onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Faixa</label>
          <select
            value={filtros.faixa}
            onChange={(e) => onChange({ ...filtros, faixa: e.target.value as FiltrosUI['faixa'] })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter sm:w-40"
          >
            {FAIXAS.map((f) => (
              <option key={f} value={f}>
                {f === 'todas' ? 'Todas' : FAIXA_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        {mostrarStatus && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status do funil</label>
            <select
              value={filtros.status}
              onChange={(e) => onChange({ ...filtros, status: e.target.value as FiltrosUI['status'] })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter sm:w-48"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filtro por tags (chips clicáveis) */}
      {tagsDisponiveis.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500">Tags:</span>
          {tagsDisponiveis.map((tag) => {
            const ativa = filtros.tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition ${corDaTag(
                  tag,
                )} ${ativa ? 'ring-2 ring-offset-1 ring-inter' : 'opacity-70 hover:opacity-100'}`}
              >
                {tag}
              </button>
            )
          })}
          {filtros.tags.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...filtros, tags: [] })}
              className="text-xs text-slate-400 underline-offset-2 hover:underline"
            >
              limpar
            </button>
          )}
        </div>
      )}

      {/* Toggle: mostrar arquivados */}
      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-slate-500">
        <input
          type="checkbox"
          checked={filtros.incluirArquivados}
          onChange={(e) => onChange({ ...filtros, incluirArquivados: e.target.checked })}
          className="h-3.5 w-3.5 rounded border-slate-300 text-inter focus:ring-inter"
        />
        Mostrar arquivados
      </label>
    </div>
  )
}
