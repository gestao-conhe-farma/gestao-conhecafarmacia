-- =============================================================
-- Migration 0010: Reparação idempotente da 009 + estados de subtarefa
--
-- Contexto: a 009 foi aplicada na base de dados ANTES de ser editada
-- no repositório. Reaplicá-la choca com policies já existentes, e os
-- objetos acrescentados à 009 depois da aplicação (ex.:
-- subtarefa_estado_motivos) nunca chegaram à base — o que fez falhar
-- a primeira tentativa desta migração.
--
-- Esta migração garante TODOS os objetos da 009 de forma idempotente
-- (drop policy if exists + create) e aplica as novidades da 0010.
-- Pode ser executada mais do que uma vez sem erros.
-- =============================================================

-- =============================================================
-- PARTE A — Garantir a 009 (idempotente)
-- =============================================================

-- A1. subtarefa_recusas: motivo da recusa, confidencial (só super_admin)
create table if not exists public.subtarefa_recusas (
  subtarefa_id uuid references public.subtarefas(id) on delete cascade not null,
  motivo text not null,
  recusado_por uuid references public.pessoas(id) not null,
  recusado_em timestamptz default now(),
  primary key (subtarefa_id)
);

alter table public.subtarefa_recusas enable row level security;

drop policy if exists "super_admin le motivo recusa" on public.subtarefa_recusas;
create policy "super_admin le motivo recusa" on public.subtarefa_recusas
  for select using (public.minha_role() = 'super_admin');

drop policy if exists "super_admin regista recusa" on public.subtarefa_recusas;
create policy "super_admin regista recusa" on public.subtarefa_recusas
  for insert with check (public.minha_role() = 'super_admin');

-- A2. Apagar subtarefas: criador enquanto pendente; super_admin sempre
drop policy if exists "criador apaga subtarefa pendente" on public.subtarefas;
create policy "criador apaga subtarefa pendente" on public.subtarefas
  for delete using (
    (criado_por = auth.uid() and status = 'pendente_aprovacao')
    or public.minha_role() = 'super_admin'
  );

-- A3. Desconfirmar presença: status volta a 'convidado'
alter table public.reuniao_participantes
  drop constraint if exists reuniao_participantes_status_check;
alter table public.reuniao_participantes
  add constraint reuniao_participantes_status_check
  check (status in ('convidado', 'confirmado'));

alter table public.entrevista_participantes
  drop constraint if exists entrevista_participantes_status_check;
alter table public.entrevista_participantes
  add constraint entrevista_participantes_status_check
  check (status in ('convidado', 'confirmado'));

-- A4. Desconfirmações de entrevista com justificativa (privada)
create table if not exists public.entrevista_desconfirmacoes (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid references public.atividades(id) on delete cascade not null,
  pessoa_id uuid references public.pessoas(id) on delete cascade not null,
  motivo text not null,
  criado_em timestamptz default now(),
  unique (atividade_id, pessoa_id)
);

alter table public.entrevista_desconfirmacoes enable row level security;

drop policy if exists "participante regista desconfirmação" on public.entrevista_desconfirmacoes;
create policy "participante regista desconfirmação" on public.entrevista_desconfirmacoes
  for insert with check (pessoa_id = auth.uid());

drop policy if exists "participante edita próprio motivo" on public.entrevista_desconfirmacoes;
create policy "participante edita próprio motivo" on public.entrevista_desconfirmacoes
  for update
    using (pessoa_id = auth.uid())
    with check (pessoa_id = auth.uid());

drop policy if exists "participante lê próprio motivo" on public.entrevista_desconfirmacoes;
create policy "participante lê próprio motivo" on public.entrevista_desconfirmacoes
  for select using (pessoa_id = auth.uid());

drop policy if exists "super_admin lê desconfirmações" on public.entrevista_desconfirmacoes;
create policy "super_admin lê desconfirmações" on public.entrevista_desconfirmacoes
  for select using (public.minha_role() = 'super_admin');

-- A5. Desconfirmações de presença de reunião com justificativa
create table if not exists public.reuniao_desconfirmacoes (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid references public.reunioes(id) on delete cascade not null,
  pessoa_id uuid references public.pessoas(id) on delete cascade not null,
  motivo text not null,
  criado_em timestamptz default now(),
  unique (reuniao_id, pessoa_id)
);

alter table public.reuniao_desconfirmacoes enable row level security;

drop policy if exists "participante regista desconfirmação" on public.reuniao_desconfirmacoes;
create policy "participante regista desconfirmação" on public.reuniao_desconfirmacoes
  for insert with check (pessoa_id = auth.uid());

drop policy if exists "participante edita próprio motivo" on public.reuniao_desconfirmacoes;
create policy "participante edita próprio motivo" on public.reuniao_desconfirmacoes
  for update
    using (pessoa_id = auth.uid())
    with check (pessoa_id = auth.uid());

drop policy if exists "participante lê próprio motivo" on public.reuniao_desconfirmacoes;
create policy "participante lê próprio motivo" on public.reuniao_desconfirmacoes
  for select using (pessoa_id = auth.uid());

drop policy if exists "super_admin lê desconfirmações de reunião" on public.reuniao_desconfirmacoes;
create policy "super_admin lê desconfirmações de reunião" on public.reuniao_desconfirmacoes
  for select using (public.minha_role() = 'super_admin');

-- A6. Motivos de mudança de estado de subtarefa (a tabela que faltava)
create table if not exists public.subtarefa_estado_motivos (
  id uuid primary key default gen_random_uuid(),
  subtarefa_id uuid references public.subtarefas(id) on delete cascade not null,
  pessoa_id uuid references public.pessoas(id) on delete cascade not null,
  estado_novo text not null check (estado_novo in ('concluida', 'cancelada', 'erro')),
  motivo text not null,
  criado_em timestamptz default now(),
  unique (subtarefa_id, pessoa_id, estado_novo)
);

alter table public.subtarefa_estado_motivos enable row level security;

-- Versão final: o responsável atribuído OU o criador da subtarefa
drop policy if exists "participante regista motivo estado" on public.subtarefa_estado_motivos;
create policy "participante regista motivo estado" on public.subtarefa_estado_motivos
  for insert with check (
    pessoa_id = auth.uid()
    and (
      exists (
        select 1 from public.subtarefa_responsaveis r
        where r.subtarefa_id = subtarefa_id and r.pessoa_id = auth.uid()
      )
      or exists (
        select 1 from public.subtarefas s
        where s.id = subtarefa_id and s.criado_por = auth.uid()
      )
    )
  );

drop policy if exists "participante edita próprio motivo" on public.subtarefa_estado_motivos;
create policy "participante edita próprio motivo" on public.subtarefa_estado_motivos
  for update
    using (pessoa_id = auth.uid())
    with check (pessoa_id = auth.uid());

drop policy if exists "participante lê próprio motivo" on public.subtarefa_estado_motivos;
create policy "participante lê próprio motivo" on public.subtarefa_estado_motivos
  for select using (pessoa_id = auth.uid());

drop policy if exists "super_admin lê motivos de estado" on public.subtarefa_estado_motivos;
create policy "super_admin lê motivos de estado" on public.subtarefa_estado_motivos
  for select using (public.minha_role() = 'super_admin');

-- =============================================================
-- PARTE B — Novidades da 0010
-- =============================================================

-- B1. subtarefas.status passa a aceitar 'cancelada' e 'erro'
alter table public.subtarefas
  drop constraint if exists subtarefas_status_check;
alter table public.subtarefas
  add constraint subtarefas_status_check
  check (status in (
    'pendente_aprovacao', 'aprovada', 'rejeitada',
    'concluida', 'cancelada', 'erro'
  ));

-- B2. Leitura: estados finais visíveis a todos; o responsável atribuído
--     vê a subtarefa mesmo pendente/rejeitada
drop policy if exists "ler subtarefas" on public.subtarefas;
create policy "ler subtarefas" on public.subtarefas
  for select using (
    status in ('aprovada', 'concluida', 'cancelada', 'erro')
    or criado_por = auth.uid()
    or public.minha_role() = 'super_admin'
    or exists (
      select 1 from public.subtarefa_responsaveis r
      where r.subtarefa_id = id and r.pessoa_id = auth.uid()
    )
  );

-- B3. Atualização: super_admin sempre; criador ou responsável atribuído
--     quando a subtarefa está aprovada (ou já num estado final, para
--     corrigir). O status nunca volta a pendente_aprovacao/rejeitada.
drop policy if exists "editar subtarefas" on public.subtarefas;
create policy "editar subtarefas" on public.subtarefas
  for update using (
    public.minha_role() = 'super_admin'
    or (criado_por = auth.uid() and status = 'pendente_aprovacao')
    or (
      status in ('aprovada', 'concluida', 'cancelada', 'erro')
      and (
        criado_por = auth.uid()
        or exists (
          select 1 from public.subtarefa_responsaveis r
          where r.subtarefa_id = id and r.pessoa_id = auth.uid()
        )
      )
    )
  )
  with check (
    public.minha_role() = 'super_admin'
    or (criado_por = auth.uid() and status = 'pendente_aprovacao')
    or (
      status in ('aprovada', 'concluida', 'cancelada', 'erro')
      and (
        criado_por = auth.uid()
        or exists (
          select 1 from public.subtarefa_responsaveis r
          where r.subtarefa_id = id and r.pessoa_id = auth.uid()
        )
      )
    )
  );

-- B4. O responsável atribuído pode retirar a própria atribuição
--     (recusar a subtarefa atribuída a si)
drop policy if exists "responsavel sai da subtarefa" on public.subtarefa_responsaveis;
create policy "responsavel sai da subtarefa" on public.subtarefa_responsaveis
  for delete using (pessoa_id = auth.uid());

-- B5. Recusa de atribuição (desconfirmação) com justificativa — privada
create table if not exists public.subtarefa_desconfirmacoes (
  id uuid primary key default gen_random_uuid(),
  subtarefa_id uuid references public.subtarefas(id) on delete cascade not null,
  pessoa_id uuid references public.pessoas(id) on delete cascade not null,
  motivo text not null,
  criado_em timestamptz default now(),
  unique (subtarefa_id, pessoa_id)
);

alter table public.subtarefa_desconfirmacoes enable row level security;

-- O próprio responsável regista a recusa da atribuição
drop policy if exists "responsavel regista desconfirmação" on public.subtarefa_desconfirmacoes;
create policy "responsavel regista desconfirmação" on public.subtarefa_desconfirmacoes
  for insert with check (
    pessoa_id = auth.uid()
    and exists (
      select 1 from public.subtarefa_responsaveis r
      where r.subtarefa_id = subtarefa_id and r.pessoa_id = auth.uid()
    )
  );

drop policy if exists "responsavel edita próprio motivo" on public.subtarefa_desconfirmacoes;
create policy "responsavel edita próprio motivo" on public.subtarefa_desconfirmacoes
  for update
    using (pessoa_id = auth.uid())
    with check (pessoa_id = auth.uid());

-- Só o autor lê o próprio motivo (privado)
drop policy if exists "responsavel lê próprio motivo" on public.subtarefa_desconfirmacoes;
create policy "responsavel lê próprio motivo" on public.subtarefa_desconfirmacoes
  for select using (pessoa_id = auth.uid());

-- Coordenação lê todos os justificantes
drop policy if exists "super_admin lê desconfirmações" on public.subtarefa_desconfirmacoes;
create policy "super_admin lê desconfirmações" on public.subtarefa_desconfirmacoes
  for select using (public.minha_role() = 'super_admin');

create index if not exists idx_desconf_subt_pessoa
  on public.subtarefa_desconfirmacoes(pessoa_id);
