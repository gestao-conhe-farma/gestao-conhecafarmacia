-- =============================================================
-- Conheça Farmácia — Plataforma de Gestão Interna
-- Migration 0001: schema + Row Level Security
-- =============================================================

-- Pessoas / utilizadores (fonte da verdade para roles)
create table if not exists public.pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'super_admin')),
  criado_em timestamptz default now()
);

-- Atividades de topo (inclui eventos e entrevistas como "tipos")
create table if not exists public.atividades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tipo text not null check (tipo in ('atividade', 'evento', 'entrevista')),
  prazo timestamptz,
  criado_por uuid references public.pessoas(id) not null,
  status_evento text check (status_evento in ('planeada', 'em_andamento', 'concluida')),
  parent_id uuid references public.atividades(id),
  criado_em timestamptz default now()
);

-- Responsáveis por uma atividade de topo (N:N)
create table if not exists public.atividade_responsaveis (
  atividade_id uuid references public.atividades(id) not null,
  pessoa_id uuid references public.pessoas(id) not null,
  primary key (atividade_id, pessoa_id)
);

-- Subtarefas: criadas por admins, sempre passam por aprovação
create table if not exists public.subtarefas (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid references public.atividades(id),
  titulo text not null,
  descricao text,
  prazo timestamptz,
  criado_por uuid references public.pessoas(id) not null,
  status text not null default 'pendente_aprovacao'
    check (status in ('pendente_aprovacao', 'aprovada', 'rejeitada', 'concluida')),
  aprovado_por uuid references public.pessoas(id),
  aprovado_em timestamptz,
  criado_em timestamptz default now()
);

-- Responsáveis por uma subtarefa (N:N) — base para relatório de desempenho
create table if not exists public.subtarefa_responsaveis (
  subtarefa_id uuid references public.subtarefas(id) not null,
  pessoa_id uuid references public.pessoas(id) not null,
  primary key (subtarefa_id, pessoa_id)
);

-- Participantes de uma entrevista (atividades.tipo = 'entrevista')
create table if not exists public.entrevista_participantes (
  atividade_id uuid references public.atividades(id) not null,
  pessoa_id uuid references public.pessoas(id) not null,
  status text not null default 'convidado' check (status in ('convidado', 'confirmado')),
  primary key (atividade_id, pessoa_id)
);

-- =============================================================
-- Helper: role do utilizador autenticado (fonte da verdade = pessoas)
-- SECURITY DEFINER para contornar RLS ao ler o próprio papel.
-- =============================================================
create or replace function public.minha_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.pessoas where id = auth.uid()
$$;

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.pessoas enable row level security;
alter table public.atividades enable row level security;
alter table public.atividade_responsaveis enable row level security;
alter table public.subtarefas enable row level security;
alter table public.subtarefa_responsaveis enable row level security;
alter table public.entrevista_participantes enable row level security;

-- --- pessoas ---
-- Cada utilizador lê o próprio registo; super_admins leem todos (gestão de equipa).
create policy "ler propria pessoa" on public.pessoas
  for select using (id = auth.uid() or public.minha_role() = 'super_admin');

-- Sem inserts/updates/deletes via API: contas são criadas via Admin API
-- (service_role) no ecrã Equipa. (nenhuma policy = negado por defeito)

-- --- atividades ---
-- Leitura sempre pública para autenticados (nascem já aprovadas)
create policy "ler atividades" on public.atividades
  for select using (auth.uid() is not null);

-- Escrita restrita a super_admin (criar/editar top-level)
create policy "super_admin cria atividades" on public.atividades
  for insert with check (public.minha_role() = 'super_admin');

create policy "super_admin edita atividades" on public.atividades
  for update using (public.minha_role() = 'super_admin');

-- --- atividade_responsaveis ---
create policy "ler resp atividades" on public.atividade_responsaveis
  for select using (auth.uid() is not null);

create policy "super_admin define resp atividades" on public.atividade_responsaveis
  for all using (public.minha_role() = 'super_admin') with check (public.minha_role() = 'super_admin');

-- --- subtarefas ---
-- Leitura condicionada a status: aprovada/concluida para todos;
-- pendente/rejeitada só para o criador ou super_admin
create policy "ler subtarefas" on public.subtarefas
  for select using (
    status in ('aprovada', 'concluida')
    or criado_por = auth.uid()
    or public.minha_role() = 'super_admin'
  );

-- Criação liberada a admin e super_admin (nasce pendente de aprovação)
create policy "criar subtarefas" on public.subtarefas
  for insert with check (auth.uid() is not null and criado_por = auth.uid());

-- O criador pode editar a própria subtarefa enquanto pendente;
-- super_admin pode sempre editar (aprovar/rejeitar/concluir)
create policy "editar subtarefas" on public.subtarefas
  for update using (
    public.minha_role() = 'super_admin'
    or (criado_por = auth.uid() and status = 'pendente_aprovacao')
  );

-- --- subtarefa_responsaveis ---
create policy "ler resp subtarefas" on public.subtarefa_responsaveis
  for select using (
    auth.uid() is not null
    and exists (
      select 1 from public.subtarefas s
      where s.id = subtarefa_id
        and (s.status in ('aprovada', 'concluida')
             or s.criado_por = auth.uid()
             or public.minha_role() = 'super_admin')
    )
  );

create policy "definir resp subtarefas" on public.subtarefa_responsaveis
  for all using (
    public.minha_role() = 'super_admin'
    or exists (
      select 1 from public.subtarefas s
      where s.id = subtarefa_id and s.criado_por = auth.uid()
    )
  ) with check (
    public.minha_role() = 'super_admin'
    or exists (
      select 1 from public.subtarefas s
      where s.id = subtarefa_id and s.criado_por = auth.uid()
    )
  );

-- --- entrevista_participantes ---
create policy "ler participantes" on public.entrevista_participantes
  for select using (auth.uid() is not null);

-- super_admin convida participantes
create policy "super_admin convida" on public.entrevista_participantes
  for insert with check (public.minha_role() = 'super_admin');

create policy "super_admin edita convites" on public.entrevista_participantes
  for update using (public.minha_role() = 'super_admin');

-- O próprio convidado confirma presença
create policy "participante confirma" on public.entrevista_participantes
  for update using (pessoa_id = auth.uid());

create policy "super_admin remove convites" on public.entrevista_participantes
  for delete using (public.minha_role() = 'super_admin');

-- =============================================================
-- Índices para queries frequentes
-- =============================================================
create index if not exists idx_atividades_tipo on public.atividades(tipo);
create index if not exists idx_atividades_parent on public.atividades(parent_id);
create index if not exists idx_subtarefas_status on public.subtarefas(status);
create index if not exists idx_subtarefas_atividade on public.subtarefas(atividade_id);
create index if not exists idx_resp_ativ_pessoa on public.atividade_responsaveis(pessoa_id);
create index if not exists idx_resp_subt_pessoa on public.subtarefa_responsaveis(pessoa_id);
create index if not exists idx_particip_pessoa on public.entrevista_participantes(pessoa_id);
