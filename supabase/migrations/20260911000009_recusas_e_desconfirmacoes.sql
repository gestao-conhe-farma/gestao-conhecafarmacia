-- =============================================================
-- Migration 0009: Recusas com motivo + desconfirmações
-- 1. subtarefa_recusas: motivo da recusa de uma subtarefa,
--    visível apenas para super_admins (RLS).
-- 2. RLS: apagar subtarefas (criador enquanto pendente;
--    super_admin sempre).
-- 3. Participantes podem voltar atrás na confirmação de
--    presença (reuniões e entrevistas) — status volta a
--    'convidado' enquanto a coordenação não marcar presença.
-- 4. Desconfirmações de entrevista com justificativa
--    (só o próprio participante regista; o motivo é privado).
--    Aplicado em entrevista_participantes e
--    reuniao_participantes quando existir.
-- =============================================================

-- Motivos de recusa de subtarefas (um por subtarefa)
create table if not exists public.subtarefa_recusas (
  subtarefa_id uuid references public.subtarefas(id) on delete cascade not null,
  motivo text not null,
  recusado_por uuid references public.pessoas(id) not null,
  recusado_em timestamptz default now(),
  primary key (subtarefa_id)
);

alter table public.subtarefa_recusas enable row level security;

-- O motivo fica confidencial: só super_admins o leem.
create policy "super_admin le motivo recusa" on public.subtarefa_recusas
  for select using (public.minha_role() = 'super_admin');

create policy "super_admin regista recusa" on public.subtarefa_recusas
  for insert with check (public.minha_role() = 'super_admin');

-- (Sem policy de update/delete: recusas são imutáveis via API.)

-- Apagar subtarefas: o criador, enquanto ainda pendente;
-- super_admin pode apagar sempre.
create policy "criador apaga subtarefa pendente" on public.subtarefas
  for delete using (
    (criado_por = auth.uid() and status = 'pendente_aprovacao')
    or public.minha_role() = 'super_admin'
  );

-- Permitir desfazer a confirmação: status volta a 'convidado'
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

-- =============================================================
-- Desconfirmações de entrevista com justificativa
-- =============================================================
create table if not exists public.entrevista_desconfirmacoes (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid references public.atividades(id) on delete cascade not null,
  pessoa_id uuid references public.pessoas(id) on delete cascade not null,
  motivo text not null,
  criado_em timestamptz default now(),
  unique (atividade_id, pessoa_id)
);

alter table public.entrevista_desconfirmacoes enable row level security;

-- O próprio participante regista a desconfirmação
create policy "participante regista desconfirmação" on public.entrevista_desconfirmacoes
  for insert with check (pessoa_id = auth.uid());

-- O próprio participante edita o próprio motivo enquanto status não mudar
create policy "participante edita próprio motivo" on public.entrevista_desconfirmacoes
  for update
    using (pessoa_id = auth.uid())
    with check (pessoa_id = auth.uid());

-- Só o próprio participante lê o próprio motivo (privado)
create policy "participante lê próprio motivo" on public.entrevista_desconfirmacoes
  for select using (pessoa_id = auth.uid());

-- Coordenação (super_admin) lê todos os justificantes
create policy "super_admin lê desconfirmações" on public.entrevista_desconfirmacoes
  for select using (public.minha_role() = 'super_admin');
