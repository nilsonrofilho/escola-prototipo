-- ============================================================================
-- 01_schema.sql — Escolinha Inter | Pré-Qualificação de Leads
-- Cole este arquivo INTEIRO no SQL Editor do Supabase e clique em "Run".
-- Cria: enums + tabela leads + score_config + score_thresholds + triggers.
-- Rode os arquivos NA ORDEM: 01 -> 02 -> 03 -> 04.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS (texto controlado)
-- ---------------------------------------------------------------------------

-- Faixa de qualificação do lead
do $$ begin
  create type faixa_lead as enum ('quente', 'morno', 'frio');
exception when duplicate_object then null;
end $$;

-- Estágio no funil comercial
do $$ begin
  create type status_funil as enum (
    'novo',
    'contato_feito',
    'reuniao_agendada',
    'proposta_enviada',
    'ganho',
    'perdido'
  );
exception when duplicate_object then null;
end $$;

-- Modelo de proposta recomendado pelo motor
do $$ begin
  create type modelo_proposta as enum ('licenca_mensalidade', 'revenue_share', 'indefinido');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- TABELA: leads
-- Todos os campos do ICP. Booleans para critérios sim/não; int para capacidade.
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id                              uuid primary key default gen_random_uuid(),

  -- Posse (RLS): cada lead pertence ao usuário que o criou
  user_id                         uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- Identificação / contato
  nome_instituicao                text not null,
  cidade                          text,
  contato_nome                    text,
  contato_telefone                text,
  contato_email                   text,

  -- Tipo de instituição (qualquer um do ICP pontua)
  -- 'colegio_particular' | 'escola_esportes' | 'clube_recreativo' | 'centro_esportivo' | 'outro'
  tipo_instituicao                text default 'outro',

  -- Estrutura mínima (GATES — eliminatórios)
  tem_campo_futebol               boolean not null default false, -- society OU oficial
  capacidade_alunos               int     not null default 0,     -- gate se < 100

  -- Público
  atende_faixa_5_17               boolean not null default false, -- crianças/adolescentes 5–17
  publico_classe_media_alta       boolean not null default false,

  -- Localização (manual hoje; Fase 2 = auto-enriquecimento a partir de `cidade`)
  populacao_acima_80k             boolean not null default false,
  boa_concentracao_escolas        boolean not null default false,

  -- Capacidade financeira
  pode_investir_uniformes         boolean not null default false,
  pode_pagar_licenca_mensalidade  boolean not null default false,
  aberto_revenue_share            boolean not null default false,

  -- Perfil de gestão
  gestao_visao_crescimento        boolean not null default false,
  interesse_diferenciacao         boolean not null default false,
  historico_extracurriculares     boolean not null default false,

  -- Resultado do scoring (calculado no client e persistido)
  score                           int             not null default 0,
  faixa                           faixa_lead      not null default 'frio',
  modelo_recomendado              modelo_proposta not null default 'indefinido',

  -- Funil
  status_funil                    status_funil    not null default 'novo',
  observacoes                     text,

  -- Timestamps
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists leads_user_id_idx     on public.leads (user_id);
create index if not exists leads_faixa_idx        on public.leads (faixa);
create index if not exists leads_status_funil_idx on public.leads (status_funil);

-- ---------------------------------------------------------------------------
-- TABELA: score_config — PESOS de cada critério.
-- Edite `peso` (ou `eh_gate`) aqui para ajustar o scoring SEM mexer no código.
-- `chave` casa com o campo correspondente no lead / na lógica do motor.
-- ---------------------------------------------------------------------------
create table if not exists public.score_config (
  id          uuid primary key default gen_random_uuid(),
  chave       text not null unique,
  descricao   text not null,
  peso        int  not null default 0,
  eh_gate     boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TABELA: score_thresholds — cortes de faixa.
-- Dois registros: 'corte_quente' e 'corte_morno'.
--   score >= corte_quente -> Quente
--   score >= corte_morno  -> Morno
--   senão                 -> Frio   (gate reprovado também = Frio)
-- ---------------------------------------------------------------------------
create table if not exists public.score_thresholds (
  id          uuid primary key default gen_random_uuid(),
  chave       text not null unique, -- 'corte_quente' | 'corte_morno'
  valor       int  not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TRIGGER: mantém updated_at atualizado em qualquer UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists trg_score_config_updated_at on public.score_config;
create trigger trg_score_config_updated_at
  before update on public.score_config
  for each row execute function public.set_updated_at();

drop trigger if exists trg_score_thresholds_updated_at on public.score_thresholds;
create trigger trg_score_thresholds_updated_at
  before update on public.score_thresholds
  for each row execute function public.set_updated_at();
