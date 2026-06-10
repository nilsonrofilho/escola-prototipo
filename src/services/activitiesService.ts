// ============================================================================
// activitiesService.ts — leitura do histórico de atividades.
// As atividades são GRAVADAS automaticamente por triggers no banco (07_historico.sql);
// aqui só lemos para a timeline do lead e o feed geral.
// Resiliente: se a tabela ainda não existir, retorna lista vazia.
// ============================================================================
import { supabase } from '@/lib/supabaseClient'
import type { Activity } from '@/lib/types'

// Feed geral: últimas N atividades do usuário (todas as instituições).
export async function listarAtividades(limite = 20): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite)
  if (error) return [] // tabela pode não existir ainda
  return (data as Activity[]) ?? []
}

// Timeline de um lead específico.
export async function listarAtividadesDoLead(leadId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data as Activity[]) ?? []
}
