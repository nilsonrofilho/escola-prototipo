// ============================================================================
// enrichmentService.ts — 🔌 PONTO DE EXTENSÃO DA FASE 2 (NÃO IMPLEMENTADO)
//
// Objetivo futuro: preencher AUTOMATICAMENTE dados de localização a partir da
// cidade informada no lead, eliminando o preenchimento manual de:
//   - populacao_acima_80k      (porte populacional do município)
//   - boa_concentracao_escolas (densidade de escolas particulares na região)
//
// COMO ESटE ponto seria plugado (fluxo planejado):
//   1) No leadsService.criarLead/atualizarLead, ANTES de aplicar o score,
//      chamar `enriquecerLead(input)` para completar os campos vazios.
//   2) `enriquecerLead` consultaria uma fonte de dados pública/gratuita
//      (ex.: base de municípios do IBGE para população; uma base própria/
//      cache para concentração de escolas) e derivaria os booleans.
//   3) O resultado alimentaria o mesmo scoreEngine, sem alterar a lógica de score.
//
// RESTRIÇÕES DESTA FASE:
//   - NÃO implementar agora.
//   - NÃO adicionar dependências pagas.
//   - Manter a assinatura estável para que o restante do código já "saiba"
//     onde o enriquecimento entraria.
// ============================================================================
import type { LeadInput } from '@/lib/types'

// Stub: por enquanto retorna o input inalterado.
// Quando a Fase 2 for implementada, esta função preencherá os campos de
// localização derivados da cidade (sem sobrescrever valores já informados).
export async function enriquecerLead(input: LeadInput): Promise<LeadInput> {
  // TODO (Fase 2): consultar fonte pública de população por município (ex.: IBGE)
  //   e uma base de concentração de escolas particulares; derivar:
  //     input.populacao_acima_80k = populacaoMunicipio(input.cidade) > 80_000
  //     input.boa_concentracao_escolas = densidadeEscolas(input.cidade) >= LIMIAR
  //   Respeitar valores preenchidos manualmente (não sobrescrever).
  return input
}

// Indicador para a UI: sinaliza que o enriquecimento automático ainda não está ativo.
export const ENRIQUECIMENTO_AUTOMATICO_ATIVO = false
