-- ============================================================================
-- 05_tags.sql — adiciona suporte a TAGS livres nos leads.
-- Rode no SQL Editor do Supabase DEPOIS dos arquivos 01–04.
--
-- Decisão: tags livres armazenadas como array de texto na própria tabela `leads`
-- (text[]). Simples, suficiente para o protótipo, sem tabelas extras. O filtro
-- por tag usa o operador de array do Postgres (&&  / contains).
-- ============================================================================

-- Coluna de tags (array de texto), default lista vazia.
alter table public.leads
  add column if not exists tags text[] not null default '{}';

-- Índice GIN para filtrar/contains por tag de forma eficiente.
create index if not exists leads_tags_idx on public.leads using gin (tags);

-- (Opcional) popular algumas tags de exemplo nos leads de seed, se existirem.
-- Seguro rodar mesmo que os leads não existam — apenas não afeta nada.
update public.leads set tags = array['indicação','prioridade'] where nome_instituicao = 'Colégio Horizonte Azul';
update public.leads set tags = array['follow-up']               where nome_instituicao = 'Esporte Clube Veredas';
update public.leads set tags = array['região sul']              where nome_instituicao = 'Escola Bola na Rede';
