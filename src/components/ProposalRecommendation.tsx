// ============================================================================
// ProposalRecommendation.tsx — mostra o modelo recomendado, os números do
// contrato e o script base de ligação para o decisor.
// ============================================================================
import { useState } from 'react'
import type { Lead, ModeloProposta } from '@/lib/types'
import { MODELO_LABELS } from '@/lib/types'
import { gerarScriptLigacao } from '@/scoring/scoreEngine'

// Números do modelo comercial (centralizados aqui para fácil ajuste).
const CONTRATO = {
  duracaoMeses: 36,
  licenca: 15000,
  mensalidade: 1500,
}

const real = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

function ResumoModelo({ modelo }: { modelo: ModeloProposta }) {
  if (modelo === 'licenca_mensalidade') {
    return (
      <p className="text-sm text-slate-600">
        Contrato de <strong>{CONTRATO.duracaoMeses} meses</strong>. Licença única de{' '}
        <strong>{real(CONTRATO.licenca)}</strong> + mensalidade de{' '}
        <strong>{real(CONTRATO.mensalidade)}</strong>. Melhor margem; indicado quando o lead tem
        caixa para o investimento inicial.
      </p>
    )
  }
  if (modelo === 'revenue_share') {
    return (
      <p className="text-sm text-slate-600">
        Contrato de <strong>{CONTRATO.duracaoMeses} meses</strong> em{' '}
        <strong>revenue share</strong> (divisão de receita), sem licença inicial. Indicado quando o
        lead tem perfil bom mas evita o desembolso à vista.
      </p>
    )
  }
  return (
    <p className="text-sm text-amber-700">
      Modelo a definir — <strong>qualificar a capacidade financeira</strong> (e os gates de
      estrutura) antes de apresentar uma proposta.
    </p>
  )
}

export function ProposalRecommendation({ lead }: { lead: Lead }) {
  const [copiado, setCopiado] = useState(false)
  const script = gerarScriptLigacao(lead, lead.faixa)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(script)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // Clipboard pode falhar fora de https; ignora silenciosamente.
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Modelo recomendado
        </h3>
        <p className="mt-1 text-lg font-bold text-inter">{MODELO_LABELS[lead.modelo_recomendado]}</p>
        <div className="mt-1">
          <ResumoModelo modelo={lead.modelo_recomendado} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Script de ligação para o decisor
          </h3>
          <button
            onClick={copiar}
            className="rounded-md bg-inter px-3 py-1 text-xs font-medium text-white hover:opacity-90"
          >
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
          {script}
        </pre>
      </div>
    </div>
  )
}
