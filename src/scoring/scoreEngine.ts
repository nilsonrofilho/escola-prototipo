// ============================================================================
// scoreEngine.ts — MOTOR DE SCORING (fonte única da verdade).
//
// Regras (aprovadas):
//  - Modelo: pesos somados (0–100) + GATES eliminatórios.
//  - GATES: sem campo de futebol OU capacidade < 100 alunos => faixa = 'frio'
//    (independentemente do resto).
//  - Faixa: score >= corteQuente -> quente; >= corteMorno -> morno; senão frio.
//  - Recomendação de proposta derivada da capacidade financeira.
//
// Os PESOS e CORTES vêm do banco (score_config / score_thresholds). Há um
// fallback embutido (PESOS_PADRAO/CORTES_PADRAO) para o app funcionar mesmo
// sem conexão — mas o ajuste oficial é via banco (UI ou SQL), sem mexer no código.
// ============================================================================
import type {
  Lead,
  LeadInput,
  Faixa,
  ModeloProposta,
  ScoringConfig,
  ScoreConfigRow,
  ScoreThresholdRow,
} from '@/lib/types'

// ----------------------------------------------------------------------------
// Fallback de pesos (espelha o seed 03_seed_score_config.sql). Somam 100.
// ----------------------------------------------------------------------------
export const PESOS_PADRAO: ScoringConfig['pesos'] = {
  tem_campo_futebol: { peso: 15, eh_gate: true, descricao: 'Possui campo de futebol (society/oficial)' },
  capacidade_minima_100: { peso: 12, eh_gate: true, descricao: 'Capacidade para pelo menos 100 alunos' },
  capacidade_financeira: { peso: 15, eh_gate: false, descricao: 'Paga licença+mensalidade OU aberto a rev. share' },
  publico_classe_media_alta: { peso: 12, eh_gate: false, descricao: 'Famílias de classe média / média-alta' },
  atende_faixa_5_17: { peso: 10, eh_gate: false, descricao: 'Atende crianças/adolescentes de 5 a 17 anos' },
  tipo_instituicao_icp: { peso: 8, eh_gate: false, descricao: 'Tipo de instituição dentro do ICP' },
  pode_investir_uniformes: { peso: 6, eh_gate: false, descricao: 'Condição de investir em uniformes' },
  populacao_acima_80k: { peso: 6, eh_gate: false, descricao: 'Cidade acima de 80 mil habitantes' },
  boa_concentracao_escolas: { peso: 4, eh_gate: false, descricao: 'Boa concentração de escolas particulares' },
  gestao_visao_crescimento: { peso: 5, eh_gate: false, descricao: 'Gestão com visão de crescimento' },
  interesse_diferenciacao: { peso: 4, eh_gate: false, descricao: 'Interesse em diferenciação pedagógica/esportiva' },
  historico_extracurriculares: { peso: 3, eh_gate: false, descricao: 'Histórico de investimento em extracurriculares' },
}

export const CORTE_QUENTE_PADRAO = 70
export const CORTE_MORNO_PADRAO = 40

// Capacidade mínima (gate) — também usada em validações de UI.
export const CAPACIDADE_MINIMA = 100

// Tipos de instituição que pontuam no ICP.
const TIPOS_ICP = new Set(['colegio_particular', 'escola_esportes', 'clube_recreativo', 'centro_esportivo'])

// ----------------------------------------------------------------------------
// Monta a ScoringConfig a partir das linhas do banco (com fallback).
// ----------------------------------------------------------------------------
export function montarConfig(
  configRows: ScoreConfigRow[] | null,
  thresholdRows: ScoreThresholdRow[] | null,
): ScoringConfig {
  const pesos: ScoringConfig['pesos'] = { ...PESOS_PADRAO }

  if (configRows && configRows.length > 0) {
    for (const row of configRows) {
      pesos[row.chave] = { peso: row.peso, eh_gate: row.eh_gate, descricao: row.descricao }
    }
  }

  let corteQuente = CORTE_QUENTE_PADRAO
  let corteMorno = CORTE_MORNO_PADRAO
  if (thresholdRows) {
    for (const t of thresholdRows) {
      if (t.chave === 'corte_quente') corteQuente = t.valor
      if (t.chave === 'corte_morno') corteMorno = t.valor
    }
  }

  return { pesos, corteQuente, corteMorno }
}

// Resultado detalhado do cálculo (útil para a UI explicar o porquê do score).
export interface ResultadoScore {
  score: number
  faixa: Faixa
  modelo_recomendado: ModeloProposta
  gatesReprovados: string[] // rótulos dos gates que falharam
  criteriosAtendidos: { chave: string; descricao: string; peso: number }[]
}

// Tipo mínimo aceito pelo motor (Lead ou LeadInput servem).
type LeadParaScore = Lead | LeadInput

// ----------------------------------------------------------------------------
// Mapeia cada chave de critério -> se o lead a atende (boolean).
// Centraliza a tradução "campo do lead" -> "critério do scoring".
// ----------------------------------------------------------------------------
function avaliarCriterio(chave: string, lead: LeadParaScore): boolean {
  switch (chave) {
    case 'tem_campo_futebol':
      return lead.tem_campo_futebol
    case 'capacidade_minima_100':
      return (lead.capacidade_alunos ?? 0) >= CAPACIDADE_MINIMA
    case 'capacidade_financeira':
      // Atende se pode pagar licença+mensalidade OU está aberto a revenue share.
      return lead.pode_pagar_licenca_mensalidade || lead.aberto_revenue_share
    case 'publico_classe_media_alta':
      return lead.publico_classe_media_alta
    case 'atende_faixa_5_17':
      return lead.atende_faixa_5_17
    case 'tipo_instituicao_icp':
      return TIPOS_ICP.has(lead.tipo_instituicao)
    case 'pode_investir_uniformes':
      return lead.pode_investir_uniformes
    case 'populacao_acima_80k':
      return lead.populacao_acima_80k
    case 'boa_concentracao_escolas':
      return lead.boa_concentracao_escolas
    case 'gestao_visao_crescimento':
      return lead.gestao_visao_crescimento
    case 'interesse_diferenciacao':
      return lead.interesse_diferenciacao
    case 'historico_extracurriculares':
      return lead.historico_extracurriculares
    default:
      return false
  }
}

// ----------------------------------------------------------------------------
// Recomendação de proposta (regra simples e centralizada).
// ----------------------------------------------------------------------------
function recomendarModelo(lead: LeadParaScore, gatesOk: boolean): ModeloProposta {
  if (!gatesOk) return 'indefinido'
  if (lead.pode_pagar_licenca_mensalidade) return 'licenca_mensalidade'
  if (lead.aberto_revenue_share) return 'revenue_share'
  return 'indefinido' // sinaliza "qualificar capacidade financeira antes de propor"
}

// ----------------------------------------------------------------------------
// FUNÇÃO PRINCIPAL: calcula score, faixa e recomendação.
// ----------------------------------------------------------------------------
export function calcularScore(lead: LeadParaScore, config: ScoringConfig): ResultadoScore {
  const gatesReprovados: string[] = []
  const criteriosAtendidos: ResultadoScore['criteriosAtendidos'] = []
  let score = 0

  for (const [chave, def] of Object.entries(config.pesos)) {
    const atende = avaliarCriterio(chave, lead)

    if (def.eh_gate && !atende) {
      gatesReprovados.push(def.descricao)
    }

    if (atende) {
      score += def.peso
      criteriosAtendidos.push({ chave, descricao: def.descricao, peso: def.peso })
    }
  }

  const gatesOk = gatesReprovados.length === 0

  // GATE reprovado => faixa Frio (mas mantemos o score calculado para transparência;
  // se quiser zerar visualmente, troque para `score = 0` aqui).
  let faixa: Faixa
  if (!gatesOk) {
    faixa = 'frio'
  } else if (score >= config.corteQuente) {
    faixa = 'quente'
  } else if (score >= config.corteMorno) {
    faixa = 'morno'
  } else {
    faixa = 'frio'
  }

  const modelo_recomendado = recomendarModelo(lead, gatesOk)

  return { score, faixa, modelo_recomendado, gatesReprovados, criteriosAtendidos }
}

// ----------------------------------------------------------------------------
// Gera o SCRIPT BASE de ligação para o decisor, conforme a faixa.
// ----------------------------------------------------------------------------
export function gerarScriptLigacao(lead: LeadParaScore, faixa: Faixa): string {
  const nome = lead.contato_nome?.trim() || 'responsável'
  const instituicao = lead.nome_instituicao?.trim() || 'a instituição'

  const abertura =
    `Olá, ${nome}, tudo bem? Aqui é da Escolinha Inter — projeto de formação esportiva ` +
    `licenciado da Inter de Milão. Estou falando com o(a) responsável pela ${instituicao}?`

  if (faixa === 'quente') {
    return (
      `${abertura}\n\n` +
      `Vi que a ${instituicao} tem o perfil ideal para uma parceria de licenciamento conosco: ` +
      `estrutura adequada, público na faixa certa e visão de crescimento.\n\n` +
      `Trabalhamos com a metodologia oficial da Inter de Milão, uniformes e formação de professores. ` +
      `O contrato é de 36 meses e temos dois modelos (licença + mensalidade ou revenue share).\n\n` +
      `OBJETIVO DA LIGAÇÃO: agendar uma REUNIÃO PRESENCIAL com o(a) decisor(a) ainda esta semana ` +
      `para apresentar números e cases. Você teria disponibilidade na quinta ou na sexta?`
    )
  }

  if (faixa === 'morno') {
    return (
      `${abertura}\n\n` +
      `A ${instituicao} tem potencial para nossa parceria, mas quero entender melhor alguns pontos ` +
      `antes de montar a proposta certa.\n\n` +
      `PERGUNTAS-CHAVE: Quantos alunos vocês atendem hoje na faixa de 5 a 17 anos? ` +
      `Já oferecem atividades esportivas extracurriculares? Existe abertura para investir em ` +
      `diferenciação pedagógica/esportiva nos próximos meses?\n\n` +
      `OBJETIVO: nutrir o relacionamento, mapear dores e marcar uma conversa de aprofundamento.`
    )
  }

  // frio
  return (
    `${abertura}\n\n` +
    `Hoje a ${instituicao} ainda não reúne todos os pré-requisitos para o licenciamento ` +
    `(ex.: campo de futebol e/ou capacidade mínima de alunos).\n\n` +
    `OBJETIVO: registrar o contato, entender planos de expansão de estrutura e deixar a porta ` +
    `aberta para revisitar no futuro. Posso te enviar um material institucional por e-mail/WhatsApp?`
  )
}
