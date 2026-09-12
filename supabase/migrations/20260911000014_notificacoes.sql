-- =============================================================
-- Migration 0014: Notificações in-app.
-- Uma linha por destinatário. Escritas SEMPRE via service_role
-- (lib/notificacoes.js) — por isso não existe policy de insert:
-- anon/authenticated não as podem forjar. Leitura e marcar-como-lida
-- são restritas às próprias linhas via RLS.
-- =============================================================

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid references public.pessoas(id) on delete cascade not null,
  tipo text not null,
  titulo text not null,
  corpo text,
  link text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.notificacoes enable row level security;

-- Cada um vê apenas as suas
create policy "cada um le as suas notificacoes" on public.notificacoes
  for select using (pessoa_id = auth.uid());

-- Marcar como lida: só as próprias linhas
create policy "cada um edita as suas notificacoes" on public.notificacoes
  for update using (pessoa_id = auth.uid()) with check (pessoa_id = auth.uid());

create index if not exists idx_notificacoes_pessoa
  on public.notificacoes(pessoa_id, lida, criado_em desc);
