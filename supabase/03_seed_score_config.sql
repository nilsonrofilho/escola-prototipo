-- ============================================================================
-- 03_seed_score_config.sql — pesos iniciais + cortes de faixa
-- Rode DEPOIS de 02_rls.sql.
--
-- Pesos somam 100. Para AJUSTAR o scoring depois, basta um UPDATE, ex.:
--   update public.score_config set peso = 20 where chave = 'tem_campo_futebol';
--   update public.score_thresholds set valor = 75 where chave = 'corte_quente';
-- ============================================================================

-- upsert idempotente (pode rodar de novo sem duplicar)
insert into public.score_config (chave, descricao, peso, eh_gate) values
  ('tem_campo_futebol',              'Possui campo de futebol (society ou oficial)',          15, true),
  ('capacidade_minima_100',          'Capacidade para pelo menos 100 alunos',                 12, true),
  ('capacidade_financeira',          'Pode pagar licença+mensalidade OU aberto a rev. share', 15, false),
  ('publico_classe_media_alta',      'Famílias de classe média / média-alta',                 12, false),
  ('atende_faixa_5_17',              'Atende crianças/adolescentes de 5 a 17 anos',           10, false),
  ('tipo_instituicao_icp',           'Tipo de instituição dentro do ICP',                      8, false),
  ('pode_investir_uniformes',        'Condição de investir em uniformes',                      6, false),
  ('populacao_acima_80k',            'Cidade acima de 80 mil habitantes',                      6, false),
  ('boa_concentracao_escolas',       'Boa concentração de escolas particulares na região',     4, false),
  ('gestao_visao_crescimento',       'Donos/diretores com visão de crescimento',               5, false),
  ('interesse_diferenciacao',        'Interesse em diferenciação pedagógica/esportiva',        4, false),
  ('historico_extracurriculares',    'Histórico de investimento em atividades extracurr.',     3, false)
on conflict (chave) do update
  set descricao = excluded.descricao,
      peso      = excluded.peso,
      eh_gate   = excluded.eh_gate;

-- Cortes das faixas
insert into public.score_thresholds (chave, valor) values
  ('corte_quente', 70),  -- score >= 70 => Quente
  ('corte_morno',  40)   -- score >= 40 => Morno; abaixo => Frio
on conflict (chave) do update set valor = excluded.valor;
