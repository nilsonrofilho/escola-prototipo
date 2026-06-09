// ============================================================================
// LeadDetailPage.tsx — detalhe do lead: edição + recomendação de proposta +
// script de ligação + exclusão.
// ============================================================================
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Lead, LeadInput, ScoringConfig } from '@/lib/types'
import {
  obterLead,
  atualizarLead,
  excluirLead,
  atualizarTags,
  listarTagsExistentes,
} from '@/services/leadsService'
import { carregarScoringConfig } from '@/services/scoreConfigService'
import { LeadForm } from '@/components/LeadForm'
import { ProposalRecommendation } from '@/components/ProposalRecommendation'
import { ScoreBadge } from '@/components/ScoreBadge'
import { TagInput } from '@/components/TagInput'

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [lead, setLead] = useState<Lead | null>(null)
  const [config, setConfig] = useState<ScoringConfig | null>(null)
  const [tagsExistentes, setTagsExistentes] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([obterLead(id), carregarScoringConfig(), listarTagsExistentes()])
      .then(([l, cfg, tags]) => {
        setLead(l)
        setConfig(cfg)
        setTagsExistentes(tags)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [id])

  // Atualiza só as tags (edição rápida no cabeçalho, sem entrar no modo edição).
  async function handleTags(tags: string[]) {
    if (!id || !lead) return
    setLead({ ...lead, tags }) // otimista
    try {
      await atualizarTags(id, tags)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function handleSalvar(input: LeadInput) {
    if (!id) return
    setSalvando(true)
    setErro(null)
    try {
      const atualizado = await atualizarLead(id, input)
      setLead(atualizado)
      setEditando(false)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir() {
    if (!id || !confirm('Excluir este lead permanentemente?')) return
    try {
      await excluirLead(id)
      navigate('/')
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  if (carregando) return <p className="p-8 text-center text-slate-400">Carregando…</p>
  if (!lead) return <p className="p-8 text-center text-slate-400">Lead não encontrado.</p>

  // Converte o Lead em LeadInput para preencher o formulário de edição.
  const inicial: LeadInput = { ...lead }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <button onClick={() => navigate('/')} className="text-sm text-inter hover:underline">
            ← Voltar
          </button>
          <button onClick={handleExcluir} className="text-sm text-red-600 hover:underline">
            Excluir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {erro && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{erro}</div>
        )}

        {/* Cabeçalho do lead */}
        <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{lead.nome_instituicao}</h1>
              <p className="text-sm text-slate-500">
                {lead.cidade || 'Cidade não informada'}
                {lead.contato_nome ? ` · ${lead.contato_nome}` : ''}
                {lead.contato_telefone ? ` · ${lead.contato_telefone}` : ''}
              </p>
            </div>
            <ScoreBadge faixa={lead.faixa} score={lead.score} />
          </div>

          {/* Tags editáveis inline */}
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-slate-500">Tags</label>
            <TagInput tags={lead.tags} onChange={handleTags} sugestoes={tagsExistentes} />
          </div>
        </div>

        {/* Recomendação de proposta + script */}
        <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200">
          <ProposalRecommendation lead={lead} />
        </div>

        {/* Edição */}
        <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-inter">Dados de qualificação</h2>
            {!editando && (
              <button
                onClick={() => setEditando(true)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Editar
              </button>
            )}
          </div>

          {editando && config ? (
            <LeadForm
              inicial={inicial}
              config={config}
              onSubmit={handleSalvar}
              onCancel={() => setEditando(false)}
              salvando={salvando}
              sugestoesTags={tagsExistentes}
            />
          ) : (
            <ResumoCriterios lead={lead} />
          )}
        </div>
      </main>
    </div>
  )
}

// Resumo somente-leitura dos critérios (quando não está editando).
function ResumoCriterios({ lead }: { lead: Lead }) {
  const item = (label: string, ok: boolean) => (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
        }`}
        aria-hidden
      >
        {ok ? '✓' : '–'}
      </span>
      <span className={ok ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
    </li>
  )
  return (
    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {item('Campo de futebol (gate)', lead.tem_campo_futebol)}
      {item(`Capacidade ≥ 100 (gate) — ${lead.capacidade_alunos} alunos`, lead.capacidade_alunos >= 100)}
      {item('Atende 5–17 anos', lead.atende_faixa_5_17)}
      {item('Classe média/média-alta', lead.publico_classe_media_alta)}
      {item('Cidade > 80 mil hab.', lead.populacao_acima_80k)}
      {item('Boa concentração de escolas', lead.boa_concentracao_escolas)}
      {item('Investe em uniformes', lead.pode_investir_uniformes)}
      {item('Paga licença + mensalidade', lead.pode_pagar_licenca_mensalidade)}
      {item('Aberto a revenue share', lead.aberto_revenue_share)}
      {item('Visão de crescimento', lead.gestao_visao_crescimento)}
      {item('Interesse em diferenciação', lead.interesse_diferenciacao)}
      {item('Histórico de extracurriculares', lead.historico_extracurriculares)}
    </ul>
  )
}
