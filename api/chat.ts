// ============================================================================
// api/chat.ts — Função SERVERLESS (Vercel) do Chat IA.
//
// A CHAVE DA OPENAI fica SÓ aqui (process.env.OPENAI_API_KEY), nunca no front
// nem no GitHub. O front chama POST /api/chat enviando:
//   { messages: [...], leadsResumo: [...], stats: {...} }
//
// A IA pode responder em texto E/OU pedir um gráfico via "function calling"
// (ferramenta gerar_grafico). O front então renderiza o gráfico.
//
// IMPORTANTE: em projeto Vite (não-Next), as funções em api/ usam a assinatura
// Node do @vercel/node — (req: VercelRequest, res: VercelResponse) — e respondem
// com res.status().json(). Retornar um objeto Response NÃO funciona aqui.
// ============================================================================
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Tipo do corpo esperado
interface ChatBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  leadsResumo?: unknown[] // resumo dos leads (nome, cidade, faixa, score, status, tags)
  stats?: unknown // contagens agregadas
}

// Definição da ferramenta que a IA pode chamar para gerar um gráfico.
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'gerar_grafico',
      description:
        'Gera um gráfico para visualização de dados dos leads. Use quando o usuário pedir ' +
        'para ver, mostrar, plotar ou visualizar algo, ou quando um gráfico ajudar a explicar.',
      parameters: {
        type: 'object',
        properties: {
          tipo: {
            type: 'string',
            enum: ['barras', 'pizza', 'linha'],
            description: 'Tipo de gráfico: barras (comparar categorias), pizza (proporções), linha (evolução).',
          },
          titulo: { type: 'string', description: 'Título curto do gráfico.' },
          dados: {
            type: 'array',
            description: 'Os pontos do gráfico.',
            items: {
              type: 'object',
              properties: {
                rotulo: { type: 'string', description: 'Nome da categoria/ponto.' },
                valor: { type: 'number', description: 'Valor numérico.' },
              },
              required: ['rotulo', 'valor'],
            },
          },
        },
        required: ['tipo', 'titulo', 'dados'],
      },
    },
  },
]

// Monta o prompt de sistema com o contexto dos leads.
function montarSystem(leadsResumo: unknown[], stats: unknown): string {
  return [
    'Você é o assistente de IA da "Escolinha Inter", uma rede licenciada da Inter Academy Brazil.',
    'Você ajuda a analisar e qualificar LEADS (instituições candidatas a licenciadas).',
    'Responda SEMPRE em português do Brasil, de forma objetiva e prática.',
    'Modelo comercial: contrato 36 meses, licença R$ 15.000, mensalidade R$ 1.500, ou revenue share.',
    'Faixas de qualificação: quente, morno, frio. Etapas do funil: novo, contato_feito, ' +
      'reuniao_agendada, proposta_enviada, ganho, perdido.',
    'Quando o usuário pedir para VER/MOSTRAR/PLOTAR dados, chame a ferramenta gerar_grafico ' +
      'com dados calculados a partir do resumo abaixo. Pode responder em texto também.',
    '',
    'RESUMO ATUAL DOS LEADS (JSON):',
    JSON.stringify(leadsResumo ?? []),
    '',
    'ESTATÍSTICAS AGREGADAS (JSON):',
    JSON.stringify(stats ?? {}),
  ].join('\n')
}

// Tipos auxiliares da resposta da OpenAI
interface GraficoSpec {
  tipo: 'barras' | 'pizza' | 'linha'
  titulo: string
  dados: { rotulo: string; valor: number }[]
}
interface OpenAIResponse {
  choices?: {
    message?: {
      content?: string | null
      tool_calls?: { function: { name: string; arguments: string } }[]
    }
  }[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Só aceita POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({
      error: 'OPENAI_API_KEY não configurada no servidor. Cadastre na Vercel (Environment Variables).',
    })
    return
  }

  // O Vercel já faz o parse do JSON em req.body (mas aceitamos string também).
  let body: ChatBody
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as ChatBody)
  } catch {
    res.status(400).json({ error: 'Corpo inválido (esperado JSON).' })
    return
  }

  const { messages = [], leadsResumo = [], stats = {} } = body ?? {}
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Envie ao menos uma mensagem.' })
    return
  }

  // Limita o histórico para controlar custo/contexto.
  const ultimas = messages.slice(-12)

  const payload = {
    model: 'gpt-4o-mini', // bom custo-benefício; troque para gpt-4o se quiser mais qualidade
    messages: [{ role: 'system', content: montarSystem(leadsResumo, stats) }, ...ultimas],
    tools: TOOLS,
    tool_choice: 'auto',
    temperature: 0.3,
    max_tokens: 800,
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const txt = await resp.text()
      res.status(resp.status).json({ error: 'Erro da OpenAI: ' + txt.slice(0, 500) })
      return
    }

    const data = (await resp.json()) as OpenAIResponse
    const choice = data.choices?.[0]?.message

    const texto = choice?.content ?? ''
    let grafico: GraficoSpec | null = null

    const toolCall = choice?.tool_calls?.find((t) => t.function?.name === 'gerar_grafico')
    if (toolCall) {
      try {
        grafico = JSON.parse(toolCall.function.arguments) as GraficoSpec
      } catch {
        grafico = null
      }
    }

    const respostaTexto = texto || (grafico ? `Aqui está o gráfico: ${grafico.titulo}` : '...')
    res.status(200).json({ texto: respostaTexto, grafico })
  } catch (e) {
    res.status(502).json({ error: 'Falha ao contatar a OpenAI: ' + (e as Error).message })
  }
}
