// ============================================================================
// DashboardPage.tsx — workspace principal com 3 abas:
//   • Dashboard — visão gerencial visual (gráficos)
//   • Kanban    — quadro estilo CRM, arrastável, colunas = etapas do funil
//   • Lista     — tabela com filtros finos
//
// Os leads são carregados uma vez (com filtros de faixa/busca/tags aplicados no
// servidor). O filtro de STATUS é aplicado no cliente, para o Kanban enxergar
// todas as colunas mesmo com filtros ativos.
// ============================================================================
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Lead, LeadInput, ScoringConfig, StatusFunil } from '@/lib/types'
import {
  listarLeads,
  criarLead,
  atualizarStatus,
  listarTagsExistentes,
  type FiltrosLead,
} from '@/services/leadsService'
import { carregarScoringConfig } from '@/services/scoreConfigService'
import { LeadList } from '@/components/LeadList'
import { LeadForm } from '@/components/LeadForm'
import { FilterBar, type FiltrosUI } from '@/components/FilterBar'
import { ScoreConfigPanel } from '@/components/ScoreConfigPanel'
import { KanbanBoard } from '@/components/KanbanBoard'
import { DashboardView } from '@/components/DashboardView'

type Aba = 'dashboard' | 'kanban' | 'lista'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'lista', label: 'Lista' },
]

export function DashboardPage() {
  const { user, sair } = useAuth()
  const navigate = useNavigate()

  const [aba, setAba] = useState<Aba>('dashboard')
  const [leads, setLeads] = useState<Lead[]>([])
  const [config, setConfig] = useState<ScoringConfig | null>(null)
  const [tagsExistentes, setTagsExistentes] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [filtros, setFiltros] = useState<FiltrosUI>({
    faixa: 'todas',
    status: 'todos',
    busca: '',
    tags: [],
  })
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mostrarConfig, setMostrarConfig] = useState(false)

  // Config de scoring (uma vez).
  useEffect(() => {
    carregarScoringConfig().then(setConfig).catch((e) => setErro(e.message))
  }, [])

  // Carrega leads (faixa/busca/tags no servidor; status fica no cliente).
  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const f: FiltrosLead = { faixa: filtros.faixa, busca: filtros.busca, tags: filtros.tags }
      const [data, tags] = await Promise.all([listarLeads(f), listarTagsExistentes()])
      setLeads(data)
      setTagsExistentes(tags)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [filtros.faixa, filtros.busca, filtros.tags])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // Aplica o filtro de status no cliente (usado só na aba Lista).
  const leadsLista = useMemo(
    () =>
      filtros.status === 'todos'
        ? leads
        : leads.filter((l) => l.status_funil === filtros.status),
    [leads, filtros.status],
  )

  async function handleCriar(input: LeadInput) {
    setSalvando(true)
    try {
      await criarLead(input)
      setMostrarForm(false)
      await recarregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  async function handleStatus(id: string, status: StatusFunil) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status_funil: status } : l))) // otimista
    try {
      await atualizarStatus(id, status)
    } catch (e) {
      setErro((e as Error).message)
      await recarregar()
    }
  }

  const abrir = (id: string) => navigate(`/lead/${id}`)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-inter text-sm font-black text-white">
              EI
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-800">Escolinha Inter</h1>
              <p className="text-xs text-slate-400">Pré-qualificação de leads</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:inline">{user?.email}</span>
            <button
              onClick={() => setMostrarConfig(true)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Ajustar pesos
            </button>
            <button
              onClick={sair}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="mx-auto flex max-w-6xl gap-1 px-4">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                aba === a.id
                  ? 'border-inter text-inter'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        {/* Barra de ação + filtros (oculta no Dashboard, que é visão gerencial) */}
        {aba !== 'dashboard' && (
          <div className="space-y-4 rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                {aba === 'kanban' ? 'Quadro de leads' : 'Lista de leads'}
              </h2>
              <button
                onClick={() => setMostrarForm((v) => !v)}
                className="rounded-md bg-inter px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {mostrarForm ? 'Fechar' : '+ Novo lead'}
              </button>
            </div>
            <FilterBar
              filtros={filtros}
              onChange={setFiltros}
              tagsDisponiveis={tagsExistentes}
              mostrarStatus={aba === 'lista'}
            />
          </div>
        )}

        {/* Botão de novo lead também no Dashboard */}
        {aba === 'dashboard' && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setAba('lista')
                setMostrarForm(true)
              }}
              className="rounded-md bg-inter px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + Novo lead
            </button>
          </div>
        )}

        {/* Formulário inline de novo lead */}
        {mostrarForm && config && aba !== 'dashboard' && (
          <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200">
            <h3 className="mb-4 text-sm font-semibold text-inter">Novo lead</h3>
            <LeadForm
              config={config}
              onSubmit={handleCriar}
              onCancel={() => setMostrarForm(false)}
              salvando={salvando}
              sugestoesTags={tagsExistentes}
            />
          </div>
        )}

        {erro && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{erro}</div>
        )}

        {/* Conteúdo da aba */}
        {carregando ? (
          <p className="text-center text-slate-400">Carregando leads…</p>
        ) : (
          <>
            {aba === 'dashboard' && <DashboardView leads={leads} />}
            {aba === 'kanban' && (
              <KanbanBoard leads={leads} onAbrir={abrir} onMudarStatus={handleStatus} />
            )}
            {aba === 'lista' && (
              <LeadList leads={leadsLista} onAbrir={abrir} onMudarStatus={handleStatus} />
            )}
          </>
        )}
      </main>

      {mostrarConfig && (
        <ScoreConfigPanel onFechar={() => setMostrarConfig(false)} onRecalculado={recarregar} />
      )}
    </div>
  )
}
