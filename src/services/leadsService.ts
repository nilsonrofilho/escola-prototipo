// ============================================================================
// leadsService.ts — CRUD de leads + recálculo de score ao salvar/editar.
//
// O recálculo é feito SEMPRE no cliente, via scoreEngine, antes de gravar.
// Assim o score/faixa/modelo persistidos refletem os pesos atuais do banco.
// ============================================================================
import { supabase } from '@/lib/supabaseClient'
import { calcularScore } from '@/scoring/scoreEngine'
import { carregarScoringConfig } from '@/services/scoreConfigService'
import type { Lead, LeadInput, Faixa, StatusFunil } from '@/lib/types'

export interface FiltrosLead {
  faixa?: Faixa | 'todas'
  status?: StatusFunil | 'todos'
  busca?: string // por nome da instituição / cidade
  tags?: string[] // filtra leads que contenham TODAS estas tags
  incluirArquivados?: boolean // por padrão, oculta arquivados
}

// Normaliza um registro vindo do banco para o tipo Lead, garantindo defaults
// de colunas que podem não existir ainda (tags, arquivado). Isso evita que a
// UI quebre caso o SQL de migração ainda não tenha sido rodado.
function normalizar(row: Record<string, unknown>): Lead {
  return {
    ...(row as unknown as Lead),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    arquivado: typeof row.arquivado === 'boolean' ? row.arquivado : false,
  }
}

// Lista os leads do usuário autenticado (RLS garante que só vêm os próprios).
export async function listarLeads(filtros: FiltrosLead = {}): Promise<Lead[]> {
  let query = supabase.from('leads').select('*').order('score', { ascending: false })

  if (filtros.faixa && filtros.faixa !== 'todas') {
    query = query.eq('faixa', filtros.faixa)
  }
  if (filtros.status && filtros.status !== 'todos') {
    query = query.eq('status_funil', filtros.status)
  }
  if (filtros.busca && filtros.busca.trim()) {
    const termo = `%${filtros.busca.trim()}%`
    query = query.or(`nome_instituicao.ilike.${termo},cidade.ilike.${termo}`)
  }
  if (filtros.tags && filtros.tags.length) {
    // Operador @> (contains): o array tags do lead contém todas as tags filtradas.
    query = query.contains('tags', filtros.tags)
  }

  const { data, error } = await query
  if (error) throw error
  let leads = ((data as Record<string, unknown>[]) ?? []).map(normalizar)

  // Filtro de arquivados aplicado no cliente (robusto mesmo se a coluna for nova).
  if (!filtros.incluirArquivados) {
    leads = leads.filter((l) => !l.arquivado)
  }
  return leads
}

// Arquiva / desarquiva um lead (ação reversível; não apaga nada).
export async function definirArquivado(id: string, arquivado: boolean): Promise<void> {
  const { error } = await supabase.from('leads').update({ arquivado }).eq('id', id)
  if (error) throw error
}

// Atualiza apenas as tags de um lead (atalho usado na edição inline).
export async function atualizarTags(id: string, tags: string[]): Promise<void> {
  const { error } = await supabase.from('leads').update({ tags }).eq('id', id)
  if (error) throw error
}

// Retorna a lista de tags distintas já usadas pelo usuário (para autocompletar).
// Resiliente: se a coluna `tags` ainda não existir, retorna lista vazia.
export async function listarTagsExistentes(): Promise<string[]> {
  const { data, error } = await supabase.from('leads').select('tags')
  if (error) return [] // coluna pode não existir ainda — degrada graciosamente
  const set = new Set<string>()
  for (const row of (data as { tags: string[] | null }[]) ?? []) {
    for (const t of row.tags ?? []) set.add(t)
  }
  return Array.from(set).sort()
}

// Busca um lead específico por id.
export async function obterLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? normalizar(data as Record<string, unknown>) : null
}

// Recalcula o score do input com base na config atual do banco.
// Retorna os campos derivados prontos para gravar.
async function aplicarScore(input: LeadInput) {
  const config = await carregarScoringConfig()
  const { score, faixa, modelo_recomendado } = calcularScore(input, config)
  return { ...input, score, faixa, modelo_recomendado }
}

// Cria um lead (recalcula score antes de inserir).
// user_id é preenchido pelo banco (default auth.uid()).
export async function criarLead(input: LeadInput): Promise<Lead> {
  const comScore = await aplicarScore(input)
  const { data, error } = await supabase.from('leads').insert(comScore).select().single()
  if (error) throw error
  return normalizar(data as Record<string, unknown>)
}

// Atualiza um lead (recalcula score antes de gravar).
export async function atualizarLead(id: string, input: LeadInput): Promise<Lead> {
  const comScore = await aplicarScore(input)
  const { data, error } = await supabase.from('leads').update(comScore).eq('id', id).select().single()
  if (error) throw error
  return normalizar(data as Record<string, unknown>)
}

// Atualiza apenas o status do funil (atalho usado no dashboard).
export async function atualizarStatus(id: string, status: StatusFunil): Promise<void> {
  const { error } = await supabase.from('leads').update({ status_funil: status }).eq('id', id)
  if (error) throw error
}

// Exclui um lead.
export async function excluirLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}

// Recalcula o score de TODOS os leads do usuário (útil após ajustar os pesos).
export async function recalcularTodos(): Promise<number> {
  const config = await carregarScoringConfig()
  const leads = await listarLeads()
  let atualizados = 0
  for (const lead of leads) {
    const { score, faixa, modelo_recomendado } = calcularScore(lead, config)
    if (score !== lead.score || faixa !== lead.faixa || modelo_recomendado !== lead.modelo_recomendado) {
      const { error } = await supabase
        .from('leads')
        .update({ score, faixa, modelo_recomendado })
        .eq('id', lead.id)
      if (!error) atualizados++
    }
  }
  return atualizados
}
