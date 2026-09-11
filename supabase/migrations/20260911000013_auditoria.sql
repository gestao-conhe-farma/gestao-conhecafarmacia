-- =============================================================
-- Migration 0013: Trilha de auditoria para ações administrativas.
-- Quem fez o quê e quando — relevante num contexto de dados de
-- profissionais de saúde: remoções de membros, mudanças de papel,
-- documentos criados/eliminados, contas criadas.
--
-- Escrita: apenas via service_role (helper lib/auditoria.js) —
-- nenhuma policy de insert para anon/authenticado.
-- Leitura: só super_admin.
-- =============================================================

create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  acao text not null,
  detalhes jsonb not null default '{}'::jsonb,
  pessoa_id uuid references public.pessoas(id) on delete set null,
  criado_em timestamptz not null default now()
);

alter table public.auditoria enable row level security;

create policy "super_admin le auditoria" on public.auditoria
  for select using (public.minha_role() = 'super_admin');

create index if not exists idx_auditoria_pessoa
  on public.auditoria(pessoa_id, criado_em);
create index if not exists idx_auditoria_acao
  on public.auditoria(acao, criado_em);
