# Conheça Farmácia — Plataforma de Gestão Interna
## Spec técnica inicial (v1 / MVP)

---

## 1. Stack e infraestrutura

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) + React |
| Estilo | Tailwind CSS |
| Backend / DB / Auth | Supabase (**projeto próprio, separado** do Supabase usado no site público do Conheça Farmácia) |
| Hospedagem | Vercel |

**Por que Supabase separado:** esta ferramenta é de uso interno (equipa), enquanto o site público do Conheça Farmácia tem utilizadores externos. Separar os projetos evita acoplar autenticação/dados de públicos e internos, e isola qualquer incidente de segurança de um lado do outro.

**Domínio/rota:** recomendação é subdomínio próprio (ex: `gestao.conhecafarmacia.ao`), deploy separado na Vercel, para reforçar a separação acima. Ajustar se preferir outra abordagem.

**Sem self-signup:** não existe registo público. Todas as contas são criadas manualmente pelo administrador da organização, via email da pessoa, já com o role atribuído (ver secção 3).

---

## 2. Ideia base do projeto

O Conheça Farmácia cresceu ao ponto de a coordenação de atividades por WhatsApp deixar de ser suficiente. Este projeto substitui essa coordenação por uma plataforma web onde a equipa consegue:

- Agendar **atividades**, atribuindo mais de um membro responsável
- Criar **entrevistas**, com participantes que se ligam a elas
- Criar **eventos**, compostos por várias **subtarefas** com responsável próprio, até o evento se realizar
- Ter uma tela inicial onde a equipa vê o que está aprovado e pode filtrar por tipo (atividade, evento, entrevista)
- Ter um fluxo de aprovação: nem tudo o que é criado fica visível imediatamente — depende de quem cria

O objetivo da v1 é o **módulo de Atividades + Tarefas** funcionando de ponta a ponta (criação, atribuição, aprovação, listagem, filtros). Eventos e Entrevistas já estão modelados no schema abaixo mas podem ser implementados depois da base validada.

---

## 3. Papéis e permissões

Dois papéis, atribuídos manualmente por quem cria a conta:

| Papel | Pode fazer |
|---|---|
| **admin** (utilizador comum da equipa) | Ver o que está aprovado; criar **subtarefas** (dentro de uma atividade/evento, ou soltas); confirmar participação em entrevistas para as quais foi convidado |
| **super_admin** (coordenação) | Tudo o que o admin faz, mais: criar **atividades / eventos / entrevistas de topo** (nascem já aprovadas); aprovar ou rejeitar subtarefas criadas por admins; convidar participantes para entrevistas; marcar eventos como concluídos |

**Nota sobre nomenclatura:** os termos "admin" e "super_admin" foram mantidos por serem os termos usados no briefing, mas o `admin` aqui é o papel de **menor** privilégio. Se a equipa achar isto confuso na prática, considerar renomear para `membro` / `admin` antes de expor nomes na UI — a estrutura de permissões não muda, só o rótulo.

---

## 4. Modelo de dados

```sql
-- Pessoas / utilizadores
create table pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'super_admin')),
  criado_em timestamptz default now()
);

-- Atividades de topo (inclui eventos e entrevistas como "tipos")
create table atividades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tipo text not null check (tipo in ('atividade', 'evento', 'entrevista')),
  prazo timestamptz,
  criado_por uuid references pessoas(id) not null, -- deve ser super_admin
  status_evento text check (status_evento in ('planeada', 'em_andamento', 'concluida')),
  -- status_evento só é relevante quando tipo = 'evento'; controlo manual, nunca automático
  parent_id uuid references atividades(id), -- subordina uma entrevista/atividade a um evento
  criado_em timestamptz default now()
);

-- Responsáveis por uma atividade de topo (N:N)
create table atividade_responsaveis (
  atividade_id uuid references atividades(id) not null,
  pessoa_id uuid references pessoas(id) not null,
  primary key (atividade_id, pessoa_id)
);

-- Subtarefas: criadas por admins, sempre passam por aprovação
create table subtarefas (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid references atividades(id), -- null = subtarefa "solta", fora de qualquer atividade/evento
  titulo text not null,
  descricao text,
  prazo timestamptz,
  criado_por uuid references pessoas(id) not null, -- deve ser admin
  status text not null default 'pendente_aprovacao'
    check (status in ('pendente_aprovacao', 'aprovada', 'rejeitada', 'concluida')),
  aprovado_por uuid references pessoas(id),
  aprovado_em timestamptz,
  criado_em timestamptz default now()
);

-- Responsáveis por uma subtarefa (N:N) — também é a base para relatório de desempenho por pessoa
create table subtarefa_responsaveis (
  subtarefa_id uuid references subtarefas(id) not null,
  pessoa_id uuid references pessoas(id) not null,
  primary key (subtarefa_id, pessoa_id)
);

-- Participantes de uma entrevista (atividades.tipo = 'entrevista')
create table entrevista_participantes (
  atividade_id uuid references atividades(id) not null,
  pessoa_id uuid references pessoas(id) not null,
  status text not null default 'convidado' check (status in ('convidado', 'confirmado')),
  primary key (atividade_id, pessoa_id)
);
```

### Regras de negócio chave

1. **Visibilidade pública (tela inicial):**
   - `atividades` (tipo atividade/evento/entrevista) aparecem sempre — nascem já aprovadas por serem criadas por super_admin.
   - `subtarefas` só aparecem quando `status = 'aprovada'` ou `'concluida'`. `pendente_aprovacao` e `rejeitada` só são visíveis para quem criou + super_admins.
2. **Fluxo de entrevista:** super_admin cria a entrevista e convida pessoas (`entrevista_participantes.status = 'convidado'`); a pessoa convidada confirma presença, atualizando para `'confirmado'`. Só entrevistas com participantes confirmados devem ser destacadas na tela inicial como "confirmadas".
3. **Conclusão de evento:** sempre manual, feita pelo super_admin (nunca calculada automaticamente a partir das subtarefas), justamente para permitir comparar subtarefas concluídas vs. não concluídas por responsável no momento do encerramento.
4. **Desempenho por pessoa:** decorre de `subtarefa_responsaveis` cruzado com `subtarefas.status` — contar aprovadas/concluídas vs. rejeitadas vs. em atraso (prazo passado e não concluída) por `pessoa_id`. Não é uma tela da v1, mas o modelo já suporta.
5. **Autenticação:** sem self-signup. Contas criadas via Supabase Auth Admin API (ou painel Supabase) por quem administra o projeto, associando o `role` na tabela `pessoas` (não usar apenas metadata do Auth — manter a fonte da verdade na tabela).

---

## 5. Funcionalidades da v1 (Atividades + Tarefas)

**Dentro do escopo:**
- Login (sem self-signup)
- Tela inicial: lista de atividades/subtarefas aprovadas, com filtro por tipo (atividade / evento / entrevista)
- Super_admin: criar atividade/evento/entrevista de topo
- Admin: criar subtarefa (dentro de uma atividade/evento existente, ou solta)
- Super_admin: ecrã de aprovação — listar subtarefas `pendente_aprovacao`, aprovar ou rejeitar
- Atribuir responsáveis (N pessoas) a uma atividade ou subtarefa
- Mudar estado de subtarefa (aprovada → concluída)
- Entrevista: super_admin convida participantes; participante confirma
- Evento: super_admin marca como concluído manualmente

**Fora do escopo da v1** (não implementar ainda, mas o schema já permite adicionar depois sem grande refactor):
- Notificações automáticas (email/WhatsApp) de novas atribuições ou aprovações
- Comentários ou anexos em atividades/subtarefas
- Ecrã de relatório de desempenho por pessoa
- Permissões granulares por atividade individual (além de admin/super_admin)

---

## 6. Notas para implementação

- Reaproveitar padrões visuais (Tailwind, tipografia, cores) já definidos no site público do Conheça Farmácia onde fizer sentido, para manter identidade visual consistente — mas sem partilhar código/deploy com o site público.
- Row Level Security (RLS) no Supabase deve refletir as regras da secção 4.1: leitura pública de `atividades` sempre; leitura de `subtarefas` condicionada a `status`; escrita de `atividades` restrita a `super_admin`; escrita de `subtarefas` (criação) liberada a `admin` e `super_admin`; aprovação/rejeição restrita a `super_admin`.
- Sugestão de ordem de implementação: (1) schema + Auth + criação manual de contas → (2) CRUD de atividades (super_admin) → (3) CRUD de subtarefas + fluxo de aprovação → (4) tela inicial com filtros → (5) entrevistas (convite/confirmação) → (6) eventos (subtarefas agrupadas + conclusão manual).
