-- =============================================================
-- Migration 0012: Log de tentativas de login falhadas + base para
-- rate limiting por conta no /api/auth/login.
--
-- Escrito apenas pelo servidor:
--  - insert: a route handler de login usa a service_role key
--    (ignora RLS); o anon/authenticado não tem policy de insert,
--    logo não consegue forjar registos.
--  - leitura: só super_admin (investigação de incidentes).
-- Retenção: gestão por cron/dashboard — sugerido apagar linhas com
-- mais de 90 dias (pode ser feito no Supabase Dashboard ou com
-- pg_cron mais tarde).
-- =============================================================

create table if not exists public.login_falhas (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip text,
  user_agent text,
  criado_em timestamptz not null default now()
);

alter table public.login_falhas enable row level security;

-- Ninguém escreve via API pública (inserts passam pela service_role)
-- nem lê, exceto a coordenação:
create policy "super_admin le login_falhas" on public.login_falhas
  for select using (public.minha_role() = 'super_admin');

create index if not exists idx_login_falhas_email
  on public.login_falhas(email, criado_em);
