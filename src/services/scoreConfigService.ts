// ============================================================================
// scoreConfigService.ts — lê/atualiza os PESOS e CORTES do scoring.
// ============================================================================
import { supabase } from '@/lib/supabaseClient'
import { montarConfig } from '@/scoring/scoreEngine'
import type { ScoreConfigRow, ScoreThresholdRow, ScoringConfig } from '@/lib/types'

// Carrega a configuração completa (pesos + cortes) do banco, com fallback
// embutido no motor caso as tabelas estejam vazias ou indisponíveis.
export async function carregarScoringConfig(): Promise<ScoringConfig> {
  const [{ data: pesos }, { data: cortes }] = await Promise.all([
    supabase.from('score_config').select('*'),
    supabase.from('score_thresholds').select('*'),
  ])

  return montarConfig(
    (pesos as ScoreConfigRow[] | null) ?? null,
    (cortes as ScoreThresholdRow[] | null) ?? null,
  )
}

// Retorna as linhas cruas de pesos (para a tela de ajuste).
export async function listarPesos(): Promise<ScoreConfigRow[]> {
  const { data, error } = await supabase
    .from('score_config')
    .select('*')
    .order('peso', { ascending: false })
  if (error) throw error
  return (data as ScoreConfigRow[]) ?? []
}

// Atualiza o peso (e/ou flag de gate) de um critério pela `chave`.
export async function atualizarPeso(
  chave: string,
  patch: { peso?: number; eh_gate?: boolean },
): Promise<void> {
  const { error } = await supabase.from('score_config').update(patch).eq('chave', chave)
  if (error) throw error
}

// Atualiza um corte de faixa ('corte_quente' | 'corte_morno').
export async function atualizarCorte(
  chave: 'corte_quente' | 'corte_morno',
  valor: number,
): Promise<void> {
  const { error } = await supabase.from('score_thresholds').update({ valor }).eq('chave', chave)
  if (error) throw error
}
