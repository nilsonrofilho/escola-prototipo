-- ============================================================================
-- 02_rls.sql — Row Level Security
-- Rode DEPOIS de 01_schema.sql.
--
-- Política: o usuário autenticado só enxerga/edita os PRÓPRIOS leads
-- (leads.user_id = auth.uid()).
-- score_config e score_thresholds são compartilhados (somente leitura para
-- qualquer autenticado; escrita também liberada para autenticado, já que é
-- um protótipo de 1 usuário ajustando os próprios pesos).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- LEADS
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;

-- Limpa políticas anteriores (idempotente em re-execução)
drop policy if exists "leads_select_own" on public.leads;
drop policy if exists "leads_insert_own" on public.leads;
drop policy if exists "leads_update_own" on public.leads;
drop policy if exists "leads_delete_own" on public.leads;

-- SELECT: só os próprios
create policy "leads_select_own"
  on public.leads for select
  using (auth.uid() = user_id);

-- INSERT: só pode criar leads em seu próprio nome
create policy "leads_insert_own"
  on public.leads for insert
  with check (auth.uid() = user_id);

-- UPDATE: só os próprios (e não pode "transferir" para outro user)
create policy "leads_update_own"
  on public.leads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: só os próprios
create policy "leads_delete_own"
  on public.leads for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- SCORE_CONFIG (pesos) — leitura/escrita para qualquer autenticado
-- ---------------------------------------------------------------------------
alter table public.score_config enable row level security;

drop policy if exists "score_config_rw_authenticated" on public.score_config;
create policy "score_config_rw_authenticated"
  on public.score_config for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- SCORE_THRESHOLDS (cortes) — leitura/escrita para qualquer autenticado
-- ---------------------------------------------------------------------------
alter table public.score_thresholds enable row level security;

drop policy if exists "score_thresholds_rw_authenticated" on public.score_thresholds;
create policy "score_thresholds_rw_authenticated"
  on public.score_thresholds for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
