// ============================================================================
// types.ts — Tipos TypeScript que espelham o schema do Supabase.
// ============================================================================

// Faixas de qualificação (enum faixa_lead no Postgres)
export type Faixa = 'quente' | 'morno' | 'frio'

// Estágios do funil (enum status_funil)
export type StatusFunil =
  | 'novo'
  | 'contato_feito'
  | 'reuniao_agendada'
  | 'proposta_enviada'
  | 'ganho'
  | 'perdido'

// Modelo de proposta recomendado (enum modelo_proposta)
export type ModeloProposta = 'licenca_mensalidade' | 'revenue_share' | 'indefinido'

// Tipo de instituição
export type TipoInstituicao =
  | 'colegio_particular'
  | 'escola_esportes'
  | 'clube_recreativo'
  | 'centro_esportivo'
  | 'outro'

// ----------------------------------------------------------------------------
// Lead — registro completo da tabela `leads`.
// ----------------------------------------------------------------------------
export interface Lead {
  id: string
  user_id: string

  nome_instituicao: string
  cidade: string | null
  contato_nome: string | null
  contato_telefone: string | null
  contato_email: string | null

  tipo_instituicao: TipoInstituicao

  // Estrutura (GATES)
  tem_campo_futebol: boolean
  capacidade_alunos: number

  // Público
  atende_faixa_5_17: boolean
  publico_classe_media_alta: boolean

  // Localização (manual; Fase 2 = auto)
  populacao_acima_80k: boolean
  boa_concentracao_escolas: boolean

  // Capacidade financeira
  pode_investir_uniformes: boolean
  pode_pagar_licenca_mensalidade: boolean
  aberto_revenue_share: boolean

  // Perfil de gestão
  gestao_visao_crescimento: boolean
  interesse_diferenciacao: boolean
  historico_extracurriculares: boolean

  // Resultado do scoring
  score: number
  faixa: Faixa
  modelo_recomendado: ModeloProposta

  // Funil
  status_funil: StatusFunil
  observacoes: string | null

  // Tags livres (array de texto). Ex.: ['follow-up', 'indicação'].
  tags: string[]

  created_at: string
  updated_at: string
}

// Campos editáveis no formulário (sem id/score/timestamps, que são derivados).
// user_id é preenchido pelo banco (default auth.uid()).
export type LeadInput = Omit<
  Lead,
  'id' | 'user_id' | 'score' | 'faixa' | 'modelo_recomendado' | 'created_at' | 'updated_at'
> & {
  status_funil: StatusFunil
}

// ----------------------------------------------------------------------------
// Configuração de scoring
// ----------------------------------------------------------------------------
export interface ScoreConfigRow {
  id: string
  chave: string
  descricao: string
  peso: number
  eh_gate: boolean
  updated_at: string
}

export interface ScoreThresholdRow {
  id: string
  chave: 'corte_quente' | 'corte_morno'
  valor: number
  updated_at: string
}

// Estrutura consolidada usada pelo motor de scoring.
export interface ScoringConfig {
  pesos: Record<string, { peso: number; eh_gate: boolean; descricao: string }>
  corteQuente: number
  corteMorno: number
}

// Rótulos legíveis para a UI -------------------------------------------------
export const STATUS_LABELS: Record<StatusFunil, string> = {
  novo: 'Novo',
  contato_feito: 'Contato feito',
  reuniao_agendada: 'Reunião agendada',
  proposta_enviada: 'Proposta enviada',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

export const FAIXA_LABELS: Record<Faixa, string> = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio',
}

export const TIPO_LABELS: Record<TipoInstituicao, string> = {
  colegio_particular: 'Colégio particular',
  escola_esportes: 'Escola de esportes',
  clube_recreativo: 'Clube recreativo',
  centro_esportivo: 'Centro esportivo',
  outro: 'Outro',
}

export const MODELO_LABELS: Record<ModeloProposta, string> = {
  licenca_mensalidade: 'Licença + Mensalidade',
  revenue_share: 'Revenue Share',
  indefinido: 'A definir',
}

// Ordem das etapas do funil (usada no Kanban e em selects).
export const FUNIL_ORDEM: StatusFunil[] = [
  'novo',
  'contato_feito',
  'reuniao_agendada',
  'proposta_enviada',
  'ganho',
  'perdido',
]

// Cor de destaque (Tailwind) por etapa do funil — para colunas do Kanban.
export const STATUS_COR: Record<StatusFunil, string> = {
  novo: 'slate',
  contato_feito: 'sky',
  reuniao_agendada: 'violet',
  proposta_enviada: 'amber',
  ganho: 'emerald',
  perdido: 'rose',
}

// ----------------------------------------------------------------------------
// Tags: cor determinística a partir do texto (mesma tag => mesma cor sempre).
// Retorna classes Tailwind de bg/texto/ring. Paleta segura (todas existem no build).
// ----------------------------------------------------------------------------
const PALETA_TAGS = [
  'bg-rose-100 text-rose-700 ring-rose-200',
  'bg-amber-100 text-amber-700 ring-amber-200',
  'bg-emerald-100 text-emerald-700 ring-emerald-200',
  'bg-sky-100 text-sky-700 ring-sky-200',
  'bg-violet-100 text-violet-700 ring-violet-200',
  'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200',
  'bg-teal-100 text-teal-700 ring-teal-200',
  'bg-orange-100 text-orange-700 ring-orange-200',
]

export function corDaTag(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  }
  return PALETA_TAGS[hash % PALETA_TAGS.length]
}
