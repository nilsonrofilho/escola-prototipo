-- ============================================================================
-- 04_seed_leads.sql — ~6 leads fictícios em faixas variadas (para testar o dashboard)
-- Rode DEPOIS de 03_seed_score_config.sql.
--
-- IMPORTANTE: os leads precisam de um DONO (user_id) para você enxergá-los sob RLS.
-- Como o SQL Editor roda sem usuário logado, este script associa os leads ao
-- PRIMEIRO usuário cadastrado em auth.users.
--
-- >>> PRÉ-REQUISITO: crie seu usuário ANTES de rodar este arquivo. <<<
--     (no app, tela de login, "Criar conta" com seu e-mail/senha —
--      ou em Authentication > Users no painel do Supabase.)
--
-- Os valores de score/faixa/modelo abaixo já estão calculados conforme os pesos
-- do 03_seed_score_config.sql, só para o dashboard nascer populado. O app
-- recalcula tudo automaticamente quando você cria/edita um lead.
-- ============================================================================

do $$
declare
  v_user uuid;
begin
  -- Pega o primeiro usuário cadastrado como dono dos leads de exemplo
  select id into v_user from auth.users order by created_at asc limit 1;

  if v_user is null then
    raise exception 'Nenhum usuário em auth.users. Crie sua conta no app antes de rodar o seed de leads.';
  end if;

  -- Evita duplicar se rodar de novo: limpa só os leads de exemplo deste usuário
  delete from public.leads
  where user_id = v_user
    and nome_instituicao in (
      'Colégio Horizonte Azul', 'Esporte Clube Veredas', 'Centro Esportivo Vila Nova',
      'Escola Bola na Rede', 'Colégio Pequenos Gigantes', 'Clube Recreativo Lago Sul'
    );

  insert into public.leads (
    user_id, nome_instituicao, cidade, contato_nome, contato_telefone, contato_email,
    tipo_instituicao, tem_campo_futebol, capacidade_alunos,
    atende_faixa_5_17, publico_classe_media_alta,
    populacao_acima_80k, boa_concentracao_escolas,
    pode_investir_uniformes, pode_pagar_licenca_mensalidade, aberto_revenue_share,
    gestao_visao_crescimento, interesse_diferenciacao, historico_extracurriculares,
    score, faixa, modelo_recomendado, status_funil, observacoes
  ) values
  -- 1) QUENTE — atende quase tudo, paga licença => licença+mensalidade
  (v_user, 'Colégio Horizonte Azul', 'Campinas', 'Marina Duarte', '(19) 99999-1001', 'marina@horizonteazul.com.br',
   'colegio_particular', true, 320,
   true, true,
   true, true,
   true, true, true,
   true, true, true,
   100, 'quente', 'licenca_mensalidade', 'reuniao_agendada', 'Diretora muito receptiva; já tem extracurriculares.'),

  -- 2) QUENTE — não paga licença mas aberto a revenue share
  (v_user, 'Esporte Clube Veredas', 'Londrina', 'Paulo Henrique', '(43) 99999-1002', 'paulo@ecveredas.com.br',
   'escola_esportes', true, 180,
   true, true,
   true, true,
   true, false, true,
   true, true, false,
   85, 'quente', 'revenue_share', 'contato_feito', 'Prefere modelo sem investimento inicial alto.'),

  -- 3) MORNO — bom público mas estrutura/financeiro parcial
  (v_user, 'Centro Esportivo Vila Nova', 'Juiz de Fora', 'Ana Beatriz', '(32) 99999-1003', 'ana@cevilanova.com.br',
   'centro_esportivo', true, 140,
   true, false,
   true, false,
   false, true, true,
   false, true, false,
   58, 'morno', 'licenca_mensalidade', 'novo', 'Capacidade ok; validar perfil das famílias.'),

  -- 4) MORNO — no limite do corte
  (v_user, 'Escola Bola na Rede', 'Uberaba', 'Ricardo Lima', '(34) 99999-1004', 'ricardo@bolanarede.com.br',
   'escola_esportes', true, 110,
   true, false,
   false, false,
   false, false, true,
   true, false, false,
   43, 'morno', 'revenue_share', 'novo', 'Cidade menor; abrir só via revenue share.'),

  -- 5) FRIO por GATE — sem campo de futebol (mesmo com bom perfil)
  (v_user, 'Colégio Pequenos Gigantes', 'Ribeirão Preto', 'Sônia Martins', '(16) 99999-1005', 'sonia@pequenosgigantes.com.br',
   'colegio_particular', false, 250,
   true, true,
   true, true,
   true, true, false,
   true, true, true,
   0, 'frio', 'indefinido', 'perdido', 'GATE: não possui campo de futebol. Reabordar se construírem.'),

  -- 6) FRIO por GATE — capacidade abaixo de 100
  (v_user, 'Clube Recreativo Lago Sul', 'Marília', 'Carlos Eduardo', '(14) 99999-1006', 'carlos@lagosul.com.br',
   'clube_recreativo', true, 70,
   true, false,
   false, false,
   false, false, true,
   false, false, false,
   0, 'frio', 'indefinido', 'novo', 'GATE: capacidade < 100 alunos.');

end $$;
