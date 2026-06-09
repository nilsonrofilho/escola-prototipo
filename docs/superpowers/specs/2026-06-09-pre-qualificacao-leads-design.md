# Protótipo — Pré-Qualificação de Leads (Inter Academy Brazil)

Data: 2026-06-09

## Objetivo
Agilizar a pré-qualificação de instituições (potenciais licenciados da Inter Academy)
e gerar uma recomendação de proposta + script de abordagem. Protótipo funcional rodando
localmente, conectado ao Supabase do usuário.

## Stack
- React + Vite + TypeScript
- Tailwind CSS (mobile-friendly)
- Supabase (Postgres + Auth email/senha + @supabase/supabase-js)
- Variáveis via `.env` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — nunca hardcodadas

## Decisões aprovadas
1. **Scoring = pesos somados (0–100) + GATES eliminatórios.** Sem campo de futebol OU
   capacidade < 100 alunos ⇒ lead vira Frio independentemente do resto.
2. **Localização = campos manuais agora** (`populacao_acima_80k`, `boa_concentracao_escolas`),
   com ponto de extensão comentado para Fase 2 (auto-enriquecimento). Sem dependências pagas.
3. **RLS por posse**: cada lead tem `user_id` = `auth.uid()`; políticas permitem ler/escrever
   apenas os próprios leads.

## Schema (resumo)
- `leads`: dados de contato + campos do ICP (booleans p/ critérios, int p/ capacidade),
  mais `score int`, `faixa` (enum), `modelo_recomendado` (enum), `status_funil` (enum),
  `created_at`, `updated_at`.
- `score_config`: uma linha por critério (`chave`, `descricao`, `peso`, `eh_gate`).
- `score_thresholds`: cortes de faixa (`corte_quente`, `corte_morno`).
- Enums: `faixa_lead`, `status_funil`, `modelo_proposta`.

## Motor de scoring (centralizado em `src/scoring/scoreEngine.ts`)
- Lê pesos de `score_config` e cortes de `score_thresholds` (com fallback embutido).
- Aplica gates → se falha, faixa = Frio.
- Soma pesos dos critérios atendidos (0–100).
- Deriva faixa pelos cortes (Quente ≥ 70, Morno 40–69, Frio < 40).
- Deriva `modelo_recomendado` (licença+mensalidade vs revenue share).

### Pesos (somam 100)
campo_futebol 15 (gate) · capacidade≥100 12 (gate) · pode_pagar||revenue_share 15 ·
classe_media_alta 12 · faixa_5_17 10 · tipo_instituicao 8 · uniformes 6 ·
populacao_80k 6 · concentracao_escolas 4 · visao_crescimento 5 · diferenciacao 4 ·
historico_extracurriculares 3.

### Cortes
Quente ≥ 70 · Morno 40–69 · Frio < 40 (ou gate reprovado).

## Componentes principais
LoginPage, DashboardPage (lista + filtros faixa/status + métricas), LeadDetailPage
(edição + recomendação de proposta + script de ligação), LeadForm, FilterBar, ScoreBadge,
FunnelStatusSelect, ProposalRecommendation, ScoreConfigPanel.

## Fase 2 (NÃO implementar agora)
`src/services/enrichmentService.ts` é stub comentado: ponto onde, no futuro, dados como
porte populacional e concentração de escolas seriam preenchidos automaticamente a partir
da cidade. Sem dependências pagas.

## Entregável
Projeto rodando local (`npm install` / `npm run dev`), 4 SQLs para colar no Supabase,
`.env` configurável, README completo.
