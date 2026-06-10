// ============================================================================
// ChatWidget.tsx — Assistente de IA flutuante (botão no canto inferior direito).
// Abre um painel de conversa. A IA analisa os leads e pode gerar gráficos.
// Busca os leads no momento de abrir (para ter contexto atual).
// ============================================================================
import { useEffect, useRef, useState } from 'react'
import type { Lead } from '@/lib/types'
import { listarLeads } from '@/services/leadsService'
import { enviarMensagem, type ChatMessage, type GraficoSpec } from '@/services/chatService'
import { ChartView } from '@/components/ChartView'

// Mensagem exibida (texto + gráfico opcional).
interface Bolha {
  role: 'user' | 'assistant'
  texto: string
  grafico?: GraficoSpec | null
}

const SUGESTOES = [
  'Resuma meu pipeline',
  'Quais leads priorizar?',
  'Mostre os leads por faixa',
  'Qual a taxa de conversão?',
]

export function ChatWidget() {
  const [aberto, setAberto] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [bolhas, setBolhas] = useState<Bolha[]>([
    {
      role: 'assistant',
      texto:
        'Olá! Sou o assistente da Escolinha Inter. Posso analisar seus leads, sugerir abordagens e ' +
        'gerar gráficos. O que você quer saber?',
    },
  ])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  // Carrega os leads (incluindo arquivados) quando o chat abre.
  useEffect(() => {
    if (aberto) {
      listarLeads({ incluirArquivados: true }).then(setLeads).catch(() => setLeads([]))
    }
  }, [aberto])

  // Rola para o fim a cada nova mensagem.
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [bolhas, aberto])

  async function enviar(pergunta: string) {
    const q = pergunta.trim()
    if (!q || enviando) return
    setTexto('')

    const novas: Bolha[] = [...bolhas, { role: 'user', texto: q }]
    setBolhas(novas)
    setEnviando(true)

    try {
      // Converte as bolhas em histórico simples para a API.
      const historico: ChatMessage[] = novas
        .filter((b) => b.texto)
        .map((b) => ({ role: b.role, content: b.texto }))

      const resp = await enviarMensagem(historico, leads)
      setBolhas((bs) => [...bs, { role: 'assistant', texto: resp.texto, grafico: resp.grafico }])
    } catch (e) {
      setBolhas((bs) => [
        ...bs,
        { role: 'assistant', texto: `⚠️ ${(e as Error).message}` },
      ])
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-inter text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
          aria-label="Abrir assistente de IA"
        >
          <span className="text-2xl">💬</span>
        </button>
      )}

      {/* Painel do chat */}
      {aberto && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[min(600px,80vh)] w-[min(400px,92vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between bg-inter px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <div>
                <p className="text-sm font-bold leading-tight">Assistente IA</p>
                <p className="text-[11px] text-white/70">Análise dos seus leads</p>
              </div>
            </div>
            <button
              onClick={() => setAberto(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/80 hover:bg-white/10"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {bolhas.map((b, i) => (
              <div key={i} className={b.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    b.role === 'user'
                      ? 'bg-inter text-white'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{b.texto}</p>
                  {b.grafico && (
                    <div className="mt-2">
                      <ChartView spec={b.grafico} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-200">
                  Analisando…
                </div>
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {/* Sugestões rápidas (só no início) */}
          {bolhas.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Campo de entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              enviar(texto)
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-3"
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pergunte sobre seus leads…"
              className="flex-1 rounded-full border border-slate-300 px-3 py-2 text-sm focus:border-inter focus:outline-none focus:ring-1 focus:ring-inter"
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-inter text-white hover:opacity-90 disabled:opacity-40"
              aria-label="Enviar"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  )
}
