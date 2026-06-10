// ============================================================================
// chatService.ts — client do Chat IA.
// Monta um RESUMO dos leads + estatísticas e envia para a função serverless
// /api/chat (que fala com a OpenAI com a chave escondida no servidor).
// ============================================================================
import type { Lead, Faixa, StatusFunil } from '@/lib/types'
import { FAIXA_LABELS, STATUS_LABELS } from '@/lib/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Spec do gráfico que a IA pode retornar.
export interface GraficoSpec {
  tipo: 'barras' | 'pizza' | 'linha'
  titulo: string
  dados: { rotulo: string; valor: number }[]
}

export interface ChatResposta {
  texto: string
  grafico: GraficoSpec | null
}

// Resumo enxuto de cada lead (só o que a IA precisa para analisar).
function resumirLeads(leads: Lead[]) {
  return leads.map((l) => ({
    instituicao: l.nome_instituicao,
    cidade: l.cidade ?? '—',
    faixa: FAIXA_LABELS[l.faixa],
    score: l.score,
    etapa: STATUS_LABELS[l.status_funil],
    modelo: l.modelo_recomendado,
    tags: l.tags,
    arquivado: l.arquivado,
  }))
}

// Estatísticas agregadas para dar contexto rápido à IA.
function calcularStats(leads: Lead[]) {
  const porFaixa: Record<Faixa, number> = { quente: 0, morno: 0, frio: 0 }
  const porEtapa: Record<StatusFunil, number> = {
    novo: 0,
    contato_feito: 0,
    reuniao_agendada: 0,
    proposta_enviada: 0,
    ganho: 0,
    perdido: 0,
  }
  for (const l of leads) {
    porFaixa[l.faixa]++
    porEtapa[l.status_funil]++
  }
  const fechados = porEtapa.ganho + porEtapa.perdido
  return {
    total: leads.length,
    porFaixa,
    porEtapa,
    conversao_pct: fechados ? Math.round((porEtapa.ganho / fechados) * 100) : 0,
  }
}

// Envia a conversa + contexto para o backend e devolve a resposta.
export async function enviarMensagem(
  messages: ChatMessage[],
  leads: Lead[],
): Promise<ChatResposta> {
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      leadsResumo: resumirLeads(leads),
      stats: calcularStats(leads),
    }),
  })

  if (!resp.ok) {
    let msg = `Erro ${resp.status}`
    try {
      const j = await resp.json()
      if (j?.error) msg = j.error
    } catch {
      /* ignora */
    }
    throw new Error(msg)
  }

  return (await resp.json()) as ChatResposta
}
