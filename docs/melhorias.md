# Melhorias Propostas — Gestão Conheça Farmácia

> Análise feita em setembro de 2026, sobre a app em produção
> (`gestao.conhecafarmacia.com`). Base: a realidade da equipa — eventos
> (palestras, congressos, workshops), entrevistas em TVs e rádios,
> reuniões regulares, parcerias com empresas e instituições de saúde,
> e produção de conteúdo para Facebook, TikTok, Instagram e YouTube.

---

## Resumo das prioridades

| # | Melhoria | Impacto | Esforço | Sugestão |
|---|----------|---------|---------|----------|
| 1 | ~~Notificações (email/badge)~~ | 🔴 Alto | Médio | ✅ Implementado set 2026 — sino + /notificacoes + email via Resend |
| 2 | Registo de parceiros + **lista de profissionais externos** | 🔴 Alto | Médio | Primeiro a fazer |
| 3 | Pipeline de conteúdo para redes sociais | 🔴 Alto | Médio/Grande | Planear quando doer |
| 4 | ~~Fechar o ciclo reunião → ação~~ | 🟠 Médio | Baixo | ✅ Implementado set 2026 — data-alvo nos planos + widget "Decisões à espera" |
| 5 | Reuniões recorrentes (clonar) | 🟠 Médio | Baixo | Quando der |
| 6 | Backups/exportação | 🟠 Médio | Baixo | Quando der |
| 7 | PWA (instalável no telemóvel) | 🟡 Baixo | Baixo | Quando der |
| 8 | Ambiente de staging | 🟡 Baixo | Médio | Antes da próxima mudança de RLS |
| 9 | Retenção de `login_falhas` (pg_cron) | 🟡 Baixo | Muito baixo | Quando der |

---

## 1. Notificações — ✅ IMPLEMENTADO (setembro 2026)

**Estado:** sino na topbar com badge + página `/notificacoes` com marcar-como-
lida; emails com templates da marca via Resend (`RESEND_API_KEY` na Vercel,
domínio `conhecafarmacia.com` verificado). Eventos ativos: convite/cancelamento
de reunião, ata publicada, convite de entrevista, subtarefa atribuída.

**Pendente para mais tarde:** lembrete automático 24h antes de reuniões
(precisa de cron — pg_cron ou Vercel Cron) e notificação de aprovações
pendentes para a coordenação.

**Problema original:** ninguém sabia que lhe foi atribuído algo sem entrar na
app e procurar. Reunião agendada, subtarefa atribuída, ata publicada,
aprovação pendente — tudo era silencioso.

**Proposta:** emails transacionais curtos (ex.: Resend — tem generosa camada
gratuita e integra em minutos) nos eventos que importam:

- Foste atribuído a uma subtarefa / atividade
- Reunião agendada (com data, local e pauta) — e lembrete 24h antes
- A ata da reunião X foi publicada
- Tens uma aprovação pendente (para coordenação)
- A atividade em que és responsável mudou de estado

**Complemento sem email:** um badge de "novidades" no dashboard (lista de
eventos que me dizem respeito desde a última visita). Ambos podem coexistir.

**Porquê primeiro:** uma equipa que está em eventos e deslocações só vê a
ferramenta se a ferramenta a procurar. É o que muda o uso diário.

---

## 2. Registo de parceiros + lista de profissionais externos

Duas entidades relacionadas, mas com papéis diferentes:

### 2.a — Entidades / Parceiros

Empresas e instituições de saúde/farmácia com que a equipa colabora.

**Campos mínimos:** nome, tipo (empresa, instituição de saúde, universidade,
ordem profissional…), pessoa de contacto (nome, email, telefone), notas,
documentos associados (protocolos, acordos — pode reaproveitar o bucket
`documentos` com uma categoria nova).

**Ligação a atividades:** "palestra no ISCS em parceria com a Farmácia X" —
campo `entidade_id` nas atividades (opcional, várias por atividade se preciso).

**Objetivo:** memória institucional. Daqui a um ano, saber quem contactar e o
que foi acordado, em vez de depender do WhatsApp e da memória de alguém.

### 2.b — Lista de profissionais para entrevistas (a novidade)

**Problema:** nem sempre há profissionais disponíveis *dentro* da equipa para
uma entrevista em rádio ou TV. Precisamos de um roster externo de
profissionais que podemos convidar — construído por toda a gente, não só
pela coordenação.

**Proposta:** secção nova **"Profissionais"** na app — uma lista de contactos
externos que **todos os membros podem consultar e alimentar**.

**Campos sugeridos:**

| Campo | Notas |
|-------|-------|
| Nome completo | obrigatório |
| Profissão / especialidade | ex.: farmacêutico comunitário, nutricionista, dermatologista |
| Instituição / local de trabalho | opcional |
| Contactos | telefone, email (pelo menos um) |
| Temas de conforto | ex.: automedicação, saúde materno-infantil |
| Meios onde já participou | TV, rádio, podcast — texto livre |
| Disponibilidade | ex.: manhãs de terça; só online |
| Notas internas | "excelente na explicação para leigos", "já falou do tema X em 2025" |
| Adicionado por / editado por | automático |

**Integrações que tornam a lista viva:**

- Nas **entrevistas** (secção Entrevistas de uma atividade), o campo
  "entrevistado" passa a poder escolher da lista — e o perfil do profissional
  passa a mostrar "entrevistas dadas: 3" com links. É assim que a lista se
  torna o histórico real de quem já colaborou.
- Botão "sugerir profissional" acessível a qualquer membro; a coordenação
  pode validar/editar tudo, mas **não há fila de aprovação** — confia-se na
  equipa (lista interna, não pública).

**Cuidados a ter:**

- **Dados pessoais de terceiros**: a lista é interna e restrita a membros
  autenticados (RLS `authenticated`), nunca pública. Nota de privacidade
  curta na própria secção ("contactos guardados apenas para convites a
  atividades da Conheça Farmácia").
- **Deduplicação**: ao adicionar, pesquisar por nome parecido antes de
  gravar (uma sugestão "já existe alguém com este nome?" basta).
- **Eliminação**: qualquer membro pode marcar "inativo" (saiu de disponibilidade);
  eliminação definitiva só coordenação — para não perder histórico.

**Modelo de dados (rascunho):**

```sql
create table public.profissionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  profissao text,
  instituicao text,
  telefone text,
  email text,
  temas text[],
  meios text[],                -- tv, radio, podcast…
  disponibilidade text,
  notas text,
  ativo boolean not null default true,
  criado_por uuid references public.pessoas(id),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);
-- RLS: select/insert/update para authenticated; delete só super_admin.
```

---

## 3. Pipeline de conteúdo (Facebook, TikTok, Instagram, YouTube)

**Problema:** a agenda editorial de redes sociais vive fora da app.

**Proposta (leve):** tipo de atividade **"Conteúdo"** com campos extra:

- Plataforma(s) alvo (multi-seleção)
- Estado: ideia → guião → gravação → edição → agendado → publicado
- Link da publicação + data de publicação

Com isto, o dashboard pode mostrar "conteúdos a publicar esta semana" e o
calendário de prazos inclui a agenda editorial. Não é um gestor de redes
sociais — é o mínimo para a produção não viver em planilhas.

---

## 4. Fechar o ciclo reunião → ação — ✅ IMPLEMENTADO (setembro 2026)

**Estado:** planos com data-alvo opcional (propaga-se à atividade na conversão);
widget "Decisões à espera" no painel com as aprovadas sem atividade, mais
antigas primeiro, codificadas por idade (14/30 dias).

**Problema original:** planos aprovados podiam ser convertidos em atividade
(bom!), mas nada garantia que o eram. Decisões morriam na ata.

**Proposta:**

- Campo `prazo` nos planos de reunião
- Widget no dashboard: "decisões aprovadas sem atividade" (com idade da decisão)
- Ao converter plano em atividade, o prazo propaga-se como prazo da atividade

Custo: algumas horas. É o que separa uma ata de um sistema de execução.

---

## 5. Reuniões recorrentes

Botão "criar a próxima reunião mensal" na página da reunião: clona
participantes e estrutura de pauta, avança a data. Remove atrito de todas
as semanas.

---

## 6. Backups / exportação

Documentos e atas são a memória da organização; o plano gratuito do Supabase
não inclui backups retidos. Proposta: rotina mensal (mesmo manual, via CLI):

```bash
supabase db dump -f backup-$(date +%Y%m).sql
# + cópia do bucket documentos (storage)
```

Idealmente anotado num lembrete do próprio sistema (novas notificações! 🙂).

---

## 7. PWA

O favicon/logo já existem; falta um `manifest.json` + meta tags para a app
ser instalável no telemóvel — como a equipa a usa em campo, é ganho real
por ~1h de trabalho.

---

## 8. Ambiente de staging

Zero testes e migrations aplicadas sempre em produção. Proposta: branch de
staging no Supabase (suportado no plano Pro; se não, um segundo projeto
gratuito) + previews da Vercel para PRs. A classe de bugs que apanhámos esta
semana (RLS recursiva, formato de cookie) apanhar-se-ia em staging.

---

## 9. Retenção de `login_falhas`

Linhas com +90 dias acumulam indefinidamente. Cinco linhas de pg_cron:

```sql
select cron.schedule('limpar-login-falhas', '0 3 * * *',
  $$delete from public.login_falhas where criado_em < now() - interval '90 days'$$);
```

---

## Ordem sugerida

1. **Notificações** — muda o uso diário
2. **Parceiros + profissionais externos** — protege a memória institucional e resolve a pressão real das entrevistas
3. **Ciclo reunião → ação** — salva decisões
4. Pipeline de conteúdo — quando a equipa sentir a dor
5. Restantes — incrementalmente
