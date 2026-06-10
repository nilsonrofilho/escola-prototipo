// ============================================================================
// LeadList.tsx — lista de leads. Tabela no desktop, cards no mobile.
// ============================================================================
import type { Lead, StatusFunil } from '@/lib/types'
import { ScoreBadge } from '@/components/ScoreBadge'
import { FunnelStatusSelect } from '@/components/FunnelStatusSelect'
import { TagBadge } from '@/components/TagBadge'

interface Props {
  leads: Lead[]
  onAbrir: (id: string) => void
  onMudarStatus: (id: string, status: StatusFunil) => void
  onArquivar: (id: string, arquivado: boolean) => void
}

export function LeadList({ leads, onAbrir, onMudarStatus, onArquivar }: Props) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-400">
        Nenhum lead encontrado. Cadastre o primeiro no botão “+ Novo lead”.
      </div>
    )
  }

  return (
    <>
      {/* DESKTOP: tabela */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Instituição</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Faixa</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {leads.map((lead) => (
              <tr key={lead.id} className={`hover:bg-slate-50 ${lead.arquivado ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onAbrir(lead.id)} className="font-medium text-inter hover:underline">
                      {lead.nome_instituicao}
                    </button>
                    {lead.arquivado && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        arquivado
                      </span>
                    )}
                  </div>
                  {lead.contato_nome && (
                    <div className="text-xs text-slate-400">{lead.contato_nome}</div>
                  )}
                  {lead.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {lead.tags.map((t) => (
                        <TagBadge key={t} tag={t} />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.cidade || '—'}</td>
                <td className="px-4 py-3">
                  <ScoreBadge faixa={lead.faixa} score={lead.score} />
                </td>
                <td className="px-4 py-3">
                  <FunnelStatusSelect
                    valor={lead.status_funil}
                    onChange={(s) => onMudarStatus(lead.id, s)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => onArquivar(lead.id, !lead.arquivado)}
                      className="text-xs text-slate-400 hover:text-slate-700"
                      title={lead.arquivado ? 'Desarquivar' : 'Arquivar'}
                    >
                      {lead.arquivado ? 'Desarquivar' : 'Arquivar'}
                    </button>
                    <button onClick={() => onAbrir(lead.id)} className="text-xs text-inter hover:underline">
                      Abrir →
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE: cards */}
      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className={`rounded-lg border border-slate-200 bg-white p-4 ${lead.arquivado ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => onAbrir(lead.id)} className="text-left font-semibold text-inter">
                {lead.nome_instituicao}
                {lead.arquivado && (
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    arquivado
                  </span>
                )}
              </button>
              <ScoreBadge faixa={lead.faixa} score={lead.score} />
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {lead.cidade || 'Cidade não informada'}
              {lead.contato_nome ? ` · ${lead.contato_nome}` : ''}
            </div>
            {lead.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {lead.tags.map((t) => (
                  <TagBadge key={t} tag={t} />
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-2">
              <FunnelStatusSelect valor={lead.status_funil} onChange={(s) => onMudarStatus(lead.id, s)} />
              <button
                onClick={() => onArquivar(lead.id, !lead.arquivado)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                {lead.arquivado ? 'Desarquivar' : 'Arquivar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
