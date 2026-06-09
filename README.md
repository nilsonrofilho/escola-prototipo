# Escolinha Inter — Pré-Qualificação de Leads

Protótipo funcional para agilizar a **pré-qualificação de instituições** (potenciais
licenciados da Inter Academy Brazil) e gerar uma **recomendação de proposta** + **script
de abordagem** para o decisor.

- **Front:** React + Vite + TypeScript
- **Estilo:** Tailwind CSS (mobile-friendly)
- **Backend/Persistência:** Supabase (Postgres + Auth e-mail/senha)
- **Scoring:** motor centralizado com pesos ajustáveis (via banco ou pela UI)

---

## 1. Pré-requisitos

- **Node.js 18+** (recomendado 20+) e **npm**. Verifique com:
  ```bash
  node --version
  npm --version
  ```
- Uma conta gratuita no **[Supabase](https://supabase.com)**.

---

## 2. Criar o projeto no Supabase

1. Acesse <https://supabase.com> → **New project**.
2. Dê um nome (ex.: `escolinha-inter`), defina uma senha de banco e a região mais próxima.
3. Aguarde ~1 min até o projeto provisionar.

### 2.1. Pegar as credenciais (para o `.env`)

No painel do projeto: **Project Settings → API**. Você vai precisar de dois valores:

| No painel | Vai para |
|---|---|
| **Project URL** | `VITE_SUPABASE_URL` |
| **anon public** (Project API Keys) | `VITE_SUPABASE_ANON_KEY` |

> Use a chave **anon public** — nunca a `service_role` no front-end.

---

## 3. Rodar o SQL (criar tabelas, RLS, pesos e leads de exemplo)

No painel do Supabase: **SQL Editor → New query**. Cole e rode **na ordem**, um por vez,
o conteúdo dos arquivos da pasta [`supabase/`](supabase/):

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `01_schema.sql` | Cria enums + tabelas `leads`, `score_config`, `score_thresholds` + triggers |
| 2 | `02_rls.sql` | Ativa Row Level Security (cada usuário vê só os próprios leads) |
| 3 | `03_seed_score_config.sql` | Insere os **pesos** do scoring e os **cortes** de faixa |
| 4 | `04_seed_leads.sql` | Insere ~6 **leads de exemplo** (faixas variadas) |
| 5 | `05_tags.sql` | Adiciona a coluna de **tags** (etiquetas livres) aos leads |

> ⚠️ **Importante sobre o `04_seed_leads.sql`:** ele associa os leads ao **primeiro
> usuário** cadastrado. Por isso, **crie sua conta primeiro** (passo 6) e só depois rode
> o arquivo 4. Se rodar antes, ele avisa que não há usuário e não insere nada — é só
> rodar de novo após criar a conta.

---

## 4. Configurar o `.env`

Na raiz do projeto, copie o modelo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o `.env` (já existe um em branco no projeto):

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> O prefixo `VITE_` é obrigatório. O `.env` **não** é versionado (está no `.gitignore`).
> Sempre que mudar o `.env`, **reinicie** o `npm run dev`.

---

## 5. Instalar e rodar

```bash
npm install
npm run dev
```

O app abre em <http://localhost:5173>.

---

## 6. Criar seu usuário e entrar

1. Na tela de login, clique em **“Não tem conta? Criar agora”**.
2. Informe e-mail e senha (mín. 6 caracteres) → **Criar conta**.
   - Se o Supabase estiver com *confirmação de e-mail* ligada (padrão), confirme pelo
     link enviado. Para um protótipo, você pode **desligar** em
     **Authentication → Providers → Email → “Confirm email” (off)**.
3. Faça login. Agora rode o `04_seed_leads.sql` (passo 3) para popular o dashboard,
   ou cadastre leads manualmente.

---

## 7. Como usar

O app tem **3 abas** no topo:

- **Dashboard** — visão gerencial visual: total de leads, quentes, ganhos, taxa de
  conversão, gráfico de distribuição por faixa (donut), funil por etapa (barras) e tags
  mais usadas. Bate o olho e entende o estado do pipeline.
- **Kanban** — quadro estilo CRM com uma coluna por etapa do funil
  (Novo → Contato feito → Reunião agendada → Proposta enviada → Ganho/Perdido).
  **Arraste um card** de uma coluna para outra para mudar o status. Clique no card para abrir.
- **Lista** — tabela com filtros finos (faixa, status, busca, tags).

Outros recursos:

- **+ Novo lead:** formulário com todos os critérios do ICP e **prévia do score em tempo
  real** enquanto você marca as opções.
- **Abrir um lead:** mostra o **modelo de proposta recomendado**, os números do contrato
  e um **script de ligação** pronto para copiar — além de editar, excluir e gerir tags.
- **Tags livres:** digite qualquer etiqueta (ex.: `follow-up`, `indicação`) e tecle Enter.
  Cores são automáticas. Filtre por tag clicando nos chips (no Kanban e na Lista).

---

## 8. Como funciona o scoring

O motor está centralizado em [`src/scoring/scoreEngine.ts`](src/scoring/scoreEngine.ts).

**Modelo:** soma ponderada (0–100) **+ gates eliminatórios**.

- **Gates (eliminatórios):** sem **campo de futebol** *ou* capacidade **< 100 alunos**
  ⇒ o lead vira **Frio**, independentemente do resto.
- **Faixas:** `Quente ≥ 70` · `Morno 40–69` · `Frio < 40` (ou gate reprovado).
- **Recomendação de proposta:** paga licença ⇒ *Licença + Mensalidade*; senão, aberto a
  revenue share ⇒ *Revenue Share*; senão ⇒ *A definir*.

### Pesos atuais (somam 100)

| Critério | Peso |
|---|---:|
| Campo de futebol *(gate)* | 15 |
| Capacidade ≥ 100 *(gate)* | 12 |
| Capacidade financeira (paga licença OU revenue share) | 15 |
| Classe média/média-alta | 12 |
| Atende 5–17 anos | 10 |
| Tipo de instituição no ICP | 8 |
| Investe em uniformes | 6 |
| Cidade > 80 mil hab. | 6 |
| Boa concentração de escolas | 4 |
| Visão de crescimento | 5 |
| Interesse em diferenciação | 4 |
| Histórico de extracurriculares | 3 |

---

## 9. Como ajustar os pesos do scoring

Você tem **duas formas** (sem mexer no código React):

**a) Pela interface** — botão **“Ajustar pesos”** no topo do dashboard. Edite pesos e
cortes e clique em **“Salvar e recalcular”** (recalcula todos os leads).

**b) Pelo SQL Editor do Supabase:**
```sql
-- mudar o peso de um critério
update public.score_config set peso = 20 where chave = 'tem_campo_futebol';

-- mudar um corte de faixa
update public.score_thresholds set valor = 75 where chave = 'corte_quente';
```
Depois, abra/edite qualquer lead (ou use “Ajustar pesos” → salvar) para recalcular.

> O motor usa os pesos do banco; há um *fallback* embutido com os mesmos valores caso o
> banco esteja indisponível.

---

## 10. Estrutura de pastas

```
escola-prototipo/
├─ supabase/                # SQL para colar no SQL Editor (na ordem 01→04)
├─ src/
│  ├─ lib/                  # supabaseClient.ts, types.ts
│  ├─ scoring/scoreEngine.ts  # ⭐ motor de scoring (fonte única)
│  ├─ services/             # leadsService, scoreConfigService, enrichmentService (stub Fase 2)
│  ├─ context/AuthContext.tsx
│  ├─ components/           # LeadForm, LeadList, FilterBar, ScoreBadge, etc.
│  └─ pages/                # LoginPage, DashboardPage, LeadDetailPage
├─ .env.example             # modelo de variáveis
└─ README.md
```

---

## 11. Fase 2 (não implementada) — enriquecimento automático

A arquitetura já tem o ponto de extensão em
[`src/services/enrichmentService.ts`](src/services/enrichmentService.ts): no futuro,
campos como **porte populacional** e **concentração de escolas particulares** poderão ser
preenchidos **automaticamente a partir da cidade** (ex.: base do IBGE). O stub está
comentado indicando exatamente onde plugar — **sem dependências pagas**.

---

## 12. Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| Banner amarelo “Supabase não configurado” | `.env` vazio ou sem `VITE_` | Preencha o `.env` e reinicie `npm run dev` |
| Login falha com credenciais corretas | Confirmação de e-mail pendente | Confirme o e-mail ou desligue em Authentication → Email |
| Dashboard vazio após login | Seed não rodou / rodou antes do usuário | Rode `04_seed_leads.sql` **depois** de criar a conta |
| Erro de permissão ao ler/gravar | RLS sem `02_rls.sql` | Rode o `02_rls.sql` |
| Leads não aparecem para você | Leads pertencem a outro usuário | Sob RLS, você só vê os seus; recadastre logado |
