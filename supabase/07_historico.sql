-- ============================================================================
-- 07_historico.sql — HISTÓRICO DE ATIVIDADES (log do que acontece com os leads)
-- Rode no SQL Editor do Supabase DEPOIS dos arquivos 01–06.
--
-- Cria a tabela `activities` + RLS + TRIGGERS que registram automaticamente:
--   • lead criado
--   • mudança de etapa do funil (status_funil)
--   • arquivado / desarquivado
--   • mudança de faixa (recálculo de score)
-- Cada atividade pertence ao mesmo dono do lead (RLS por user_id).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TABELA: activities
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  lead_id     uuid references public.leads(id) on delete cascade,
  lead_nome   text,                 -- snapshot do nome (sobrevive se o lead for excluído)
  tipo        text not null,        -- 'criado' | 'status' | 'arquivado' | 'desarquivado' | 'faixa'
  descricao   text not null,        -- texto legível para a timeline
  de_valor    text,                 -- valor anterior (ex.: 'novo')
  para_valor  text,                 -- valor novo (ex.: 'contato_feito')
  created_at  timestamptz not null default now()
);

create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_lead_id_idx  on public.activities (lead_id);
create index if not exists activities_created_idx  on public.activities (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: cada usuário só vê/cria as próprias atividades
-- ---------------------------------------------------------------------------
alter table public.activities enable row level security;

drop policy if exists "activities_select_own" on public.activities;
create policy "activities_select_own"
  on public.activities for select
  using (auth.uid() = user_id);

drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own"
  on public.activities for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Rótulos legíveis para status do funil (usado nas mensagens do log)
-- ---------------------------------------------------------------------------
create or replace function public.label_status(s text)
returns text as $$
begin
  return case s
    when 'novo' then 'Novo'
    when 'contato_feito' then 'Contato feito'
    when 'reuniao_agendada' then 'Reunião agendada'
    when 'proposta_enviada' then 'Proposta enviada'
    when 'ganho' then 'Ganho'
    when 'perdido' then 'Perdido'
    else s
  end;
end;
$$ language plpgsql immutable;

-- ---------------------------------------------------------------------------
-- TRIGGER 1: lead criado
-- ---------------------------------------------------------------------------
create or replace function public.log_lead_insert()
returns trigger as $$
begin
  insert into public.activities (user_id, lead_id, lead_nome, tipo, descricao, para_valor)
  values (
    new.user_id, new.id, new.nome_instituicao, 'criado',
    'Lead criado — faixa ' || new.faixa, new.faixa
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_lead_insert on public.leads;
create trigger trg_log_lead_insert
  after insert on public.leads
  for each row execute function public.log_lead_insert();

-- ---------------------------------------------------------------------------
-- TRIGGER 2: updates (status, arquivado, faixa)
-- ---------------------------------------------------------------------------
create or replace function public.log_lead_update()
returns trigger as $$
begin
  -- Mudança de etapa do funil
  if new.status_funil is distinct from old.status_funil then
    insert into public.activities (user_id, lead_id, lead_nome, tipo, descricao, de_valor, para_valor)
    values (
      new.user_id, new.id, new.nome_instituicao, 'status',
      'Movido de "' || public.label_status(old.status_funil) ||
        '" para "' || public.label_status(new.status_funil) || '"',
      old.status_funil, new.status_funil
    );
  end if;

  -- Arquivar / desarquivar
  if new.arquivado is distinct from old.arquivado then
    insert into public.activities (user_id, lead_id, lead_nome, tipo, descricao)
    values (
      new.user_id, new.id, new.nome_instituicao,
      case when new.arquivado then 'arquivado' else 'desarquivado' end,
      case when new.arquivado then 'Lead arquivado' else 'Lead desarquivado' end
    );
  end if;

  -- Mudança de faixa (efeito de recálculo de score)
  if new.faixa is distinct from old.faixa then
    insert into public.activities (user_id, lead_id, lead_nome, tipo, descricao, de_valor, para_valor)
    values (
      new.user_id, new.id, new.nome_instituicao, 'faixa',
      'Faixa alterada de ' || old.faixa || ' para ' || new.faixa,
      old.faixa, new.faixa
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_lead_update on public.leads;
create trigger trg_log_lead_update
  after update on public.leads
  for each row execute function public.log_lead_update();

-- ---------------------------------------------------------------------------
-- (Opcional) registra atividade inicial para os leads de seed já existentes,
-- para a timeline/feed não nascer vazio. Seguro rodar de novo (evita duplicar).
-- ---------------------------------------------------------------------------
insert into public.activities (user_id, lead_id, lead_nome, tipo, descricao, para_valor, created_at)
select l.user_id, l.id, l.nome_instituicao, 'criado',
       'Lead criado — faixa ' || l.faixa, l.faixa, l.created_at
from public.leads l
where not exists (
  select 1 from public.activities a where a.lead_id = l.id and a.tipo = 'criado'
);
