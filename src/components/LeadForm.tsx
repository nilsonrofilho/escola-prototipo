// ============================================================================
// LeadForm.tsx — formulário de cadastro/qualificação do lead (todos os campos do ICP).
// Mostra uma PRÉVIA do score em tempo real conforme você marca os critérios.
// ============================================================================
import { useMemo, useState } from 'react'
import type { LeadInput, ScoringConfig, TipoInstituicao } from '@/lib/types'
import { TIPO_LABELS } from '@/lib/types'
import { calcularScore } from '@/scoring/scoreEngine'
import { ScoreBadge } from '@/components/ScoreBadge'
import { TagInput } from '@/components/TagInput'

interface Props {
  inicial?: Partial<LeadInput>
  config: ScoringConfig
  onSubmit: (input: LeadInput) => Promise<void>
  onCancel?: () => void
  salvando?: boolean
  sugestoesTags?: string[]
}

// Estado padrão de um lead novo (tudo falso/zero).
const VAZIO: LeadInput = {
  nome_instituicao: '',
  cidade: '',
  contato_nome: '',
  contato_telefone: '',
  contato_email: '',
  tipo_instituicao: 'colegio_particular',
  tem_campo_futebol: false,
  capacidade_alunos: 0,
  atende_faixa_5_17: false,
  publico_classe_media_alta: false,
  populacao_acima_80k: false,
  boa_concentracao_escolas: false,
  pode_investir_uniformes: false,
  pode_pagar_licenca_mensalidade: false,
  aberto_revenue_share: false,
  gestao_visao_crescimento: false,
  interesse_diferenciacao: false,
  historico_extracurriculares: false,
  status_funil: 'novo',
  observacoes: '',
  tags: [],
}

const TIPOS: TipoInstituicao[] = [
  'colegio_particular',
  'escola_esportes',
  'clube_recreativo',
  'centro_esportivo',
  'outro',
]

// Checkbox reutilizável.
function Check({
  label,
  checked,
  onChange,
  dica,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  dica?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-inter focus:ring-inter"
      />
      <span className="text-sm text-slate-700">
        {label}
        {dica && <span className="block text-xs text-slate-400">{dica}</span>}
      </span>
    </label>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-inter">{titulo}</legend>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export function LeadForm({ inicial, config, onSubmit, onCancel, salvando, sugestoesTags }: Props) {
  const [form, setForm] = useState<LeadInput>({ ...VAZIO, ...inicial })
  const [erro, setErro] = useState<string | null>(null)

  function set<K extends keyof LeadInput>(campo: K, valor: LeadInput[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  // Prévia do score recalculada a cada alteração (sem ir ao banco).
  const previa = useMemo(() => calcularScore(form, config), [form, config])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!form.nome_instituicao.trim()) {
      setErro('Informe o nome da instituição.')
      return
    }
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Prévia do score sempre visível no topo */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
        <span className="text-sm font-medium text-slate-500">Prévia da qualificação:</span>
        <ScoreBadge faixa={previa.faixa} score={previa.score} />
        {previa.gatesReprovados.length > 0 && (
          <span className="text-xs text-red-600">
            ⚠ Gate reprovado: {previa.gatesReprovados.join(', ')}
          </span>
        )}
      </div>

      {/* Identificação / contato */}
      <Secao titulo="Identificação e contato">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">Nome da instituição *</label>
          <input
            value={form.nome_instituicao}
            onChange={(e) => set('nome_instituicao', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Cidade</label>
          <input
            value={form.cidade ?? ''}
            onChange={(e) => set('cidade', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Tipo de instituição</label>
          <select
            value={form.tipo_instituicao}
            onChange={(e) => set('tipo_instituicao', e.target.value as TipoInstituicao)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Decisor (nome)</label>
          <input
            value={form.contato_nome ?? ''}
            onChange={(e) => set('contato_nome', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Telefone</label>
          <input
            value={form.contato_telefone ?? ''}
            onChange={(e) => set('contato_telefone', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">E-mail</label>
          <input
            type="email"
            value={form.contato_email ?? ''}
            onChange={(e) => set('contato_email', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
          />
        </div>
      </Secao>

      {/* Estrutura (GATES) */}
      <Secao titulo="Estrutura mínima (eliminatória)">
        <Check
          label="Possui campo de futebol (society ou oficial)"
          dica="GATE — sem campo, o lead vira Frio."
          checked={form.tem_campo_futebol}
          onChange={(v) => set('tem_campo_futebol', v)}
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Capacidade de alunos (GATE: mínimo 100)
          </label>
          <input
            type="number"
            min={0}
            value={form.capacidade_alunos}
            onChange={(e) => set('capacidade_alunos', Number(e.target.value) || 0)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
          />
        </div>
      </Secao>

      {/* Público */}
      <Secao titulo="Público">
        <Check
          label="Atende crianças/adolescentes de 5 a 17 anos"
          checked={form.atende_faixa_5_17}
          onChange={(v) => set('atende_faixa_5_17', v)}
        />
        <Check
          label="Famílias de classe média / média-alta"
          checked={form.publico_classe_media_alta}
          onChange={(v) => set('publico_classe_media_alta', v)}
        />
      </Secao>

      {/* Localização (manual; Fase 2 = auto) */}
      <Secao titulo="Localização">
        <Check
          label="Cidade acima de 80 mil habitantes"
          dica="Fase 2: preenchido automaticamente pela cidade."
          checked={form.populacao_acima_80k}
          onChange={(v) => set('populacao_acima_80k', v)}
        />
        <Check
          label="Boa concentração de escolas particulares na região"
          dica="Fase 2: preenchido automaticamente."
          checked={form.boa_concentracao_escolas}
          onChange={(v) => set('boa_concentracao_escolas', v)}
        />
      </Secao>

      {/* Capacidade financeira */}
      <Secao titulo="Capacidade financeira">
        <Check
          label="Condição de investir em uniformes"
          checked={form.pode_investir_uniformes}
          onChange={(v) => set('pode_investir_uniformes', v)}
        />
        <Check
          label="Pode pagar licença + mensalidade"
          checked={form.pode_pagar_licenca_mensalidade}
          onChange={(v) => set('pode_pagar_licenca_mensalidade', v)}
        />
        <Check
          label="Aberto a modelo de revenue share"
          checked={form.aberto_revenue_share}
          onChange={(v) => set('aberto_revenue_share', v)}
        />
      </Secao>

      {/* Perfil de gestão */}
      <Secao titulo="Perfil de gestão">
        <Check
          label="Donos/diretores com visão de crescimento"
          checked={form.gestao_visao_crescimento}
          onChange={(v) => set('gestao_visao_crescimento', v)}
        />
        <Check
          label="Interesse em diferenciação pedagógica/esportiva"
          checked={form.interesse_diferenciacao}
          onChange={(v) => set('interesse_diferenciacao', v)}
        />
        <Check
          label="Histórico de investimento em extracurriculares"
          checked={form.historico_extracurriculares}
          onChange={(v) => set('historico_extracurriculares', v)}
        />
      </Secao>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Tags</label>
        <TagInput
          tags={form.tags}
          onChange={(tags) => set('tags', tags)}
          sugestoes={sugestoesTags}
        />
      </div>

      {/* Observações */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Observações</label>
        <textarea
          rows={3}
          value={form.observacoes ?? ''}
          onChange={(e) => set('observacoes', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-inter px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar lead'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
