-- ============================================================================
-- 06_tags_arquivar_seed.sql — RODE ESTE ARQUIVO INTEIRO no SQL Editor do Supabase.
--
-- Resolve de uma vez:
--   1) o erro "column leads.tags does not exist" (cria a coluna tags)
--   2) adiciona o recurso ARQUIVAR (coluna `arquivado`)
--   3) popula ~8 leads de DADOS FAKE em faixas/etapas variadas
--
-- É idempotente: pode rodar de novo sem duplicar nem dar erro.
-- PRÉ-REQUISITO: você já precisa ter criado sua conta (login no app) — o seed
-- associa os leads ao primeiro usuário de auth.users.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) TAGS (corrige o bug) + 2) ARQUIVAR
-- ---------------------------------------------------------------------------
alter table public.leads add column if not exists tags text[] not null default '{}';
create index if not exists leads_tags_idx on public.leads using gin (tags);

alter table public.leads add column if not exists arquivado boolean not null default false;
create index if not exists leads_arquivado_idx on public.leads (arquivado);

-- ---------------------------------------------------------------------------
-- 3) SEED DE DADOS FAKE (~8 leads variados)
-- ---------------------------------------------------------------------------
do $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users order by created_at asc limit 1;
  if v_user is null then
    raise exception 'Crie sua conta no app (login) antes de rodar o seed.';
  end if;

  -- Limpa os fakes anteriores deste usuário (evita duplicar em re-execução)
  delete from public.leads
  where user_id = v_user
    and nome_instituicao in (
      'Colégio Horizonte Azul','Esporte Clube Veredas','Centro Esportivo Vila Nova',
      'Escola Bola na Rede','Colégio Pequenos Gigantes','Clube Recreativo Lago Sul',
      'Instituto Craques do Amanhã','Colégio São Bernardo'
    );

  insert into public.leads (
    user_id, nome_instituicao, cidade, contato_nome, contato_telefone, contato_email,
    tipo_instituicao, tem_campo_futebol, capacidade_alunos,
    atende_faixa_5_17, publico_classe_media_alta,
    populacao_acima_80k, boa_concentracao_escolas,
    pode_investir_uniformes, pode_pagar_licenca_mensalidade, aberto_revenue_share,
    gestao_visao_crescimento, interesse_diferenciacao, historico_extracurriculares,
    score, faixa, modelo_recomendado, status_funil, tags, arquivado, observacoes
  ) values
  (v_user,'Colégio Horizonte Azul','Campinas','Marina Duarte','(19) 99999-1001','marina@horizonteazul.com.br',
   'colegio_particular',true,320, true,true, true,true, true,true,true, true,true,true,
   100,'quente','licenca_mensalidade','reuniao_agendada', array['indicação','prioridade'], false,
   'Diretora muito receptiva; já tem extracurriculares.'),

  (v_user,'Esporte Clube Veredas','Londrina','Paulo Henrique','(43) 99999-1002','paulo@ecveredas.com.br',
   'escola_esportes',true,180, true,true, true,true, true,false,true, true,true,false,
   85,'quente','revenue_share','contato_feito', array['follow-up'], false,
   'Prefere modelo sem investimento inicial alto.'),

  (v_user,'Instituto Craques do Amanhã','Sorocaba','Felipe Aragão','(15) 99999-1007','felipe@craques.com.br',
   'escola_esportes',true,210, true,true, true,true, true,true,true, true,true,true,
   92,'quente','licenca_mensalidade','proposta_enviada', array['indicação','quente'], false,
   'Proposta enviada; aguardando retorno do conselho.'),

  (v_user,'Centro Esportivo Vila Nova','Juiz de Fora','Ana Beatriz','(32) 99999-1003','ana@cevilanova.com.br',
   'centro_esportivo',true,140, true,false, true,false, false,true,true, false,true,false,
   58,'morno','licenca_mensalidade','novo', array['região sudeste'], false,
   'Capacidade ok; validar perfil das famílias.'),

  (v_user,'Escola Bola na Rede','Uberaba','Ricardo Lima','(34) 99999-1004','ricardo@bolanarede.com.br',
   'escola_esportes',true,110, true,false, false,false, false,false,true, true,false,false,
   43,'morno','revenue_share','novo', array['região sul'], false,
   'Cidade menor; abrir só via revenue share.'),

  (v_user,'Colégio São Bernardo','São Bernardo do Campo','Helena Castro','(11) 99999-1008','helena@saobernardo.com.br',
   'colegio_particular',true,260, true,true, true,true, true,true,false, true,true,true,
   88,'quente','licenca_mensalidade','ganho', array['cliente','indicação'], false,
   'Fechado! Contrato assinado.'),

  (v_user,'Colégio Pequenos Gigantes','Ribeirão Preto','Sônia Martins','(16) 99999-1005','sonia@pequenosgigantes.com.br',
   'colegio_particular',false,250, true,true, true,true, true,true,false, true,true,true,
   0,'frio','indefinido','perdido', array['sem-campo'], false,
   'GATE: não possui campo de futebol.'),

  (v_user,'Clube Recreativo Lago Sul','Marília','Carlos Eduardo','(14) 99999-1006','carlos@lagosul.com.br',
   'clube_recreativo',true,70, true,false, false,false, false,false,true, false,false,false,
   0,'frio','indefinido','novo', array['baixa-capacidade'], true,  -- arquivado de exemplo
   'GATE: capacidade < 100 alunos. Arquivado.');
end $$;
