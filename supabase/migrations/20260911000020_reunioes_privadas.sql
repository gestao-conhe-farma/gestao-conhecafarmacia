-- =============================================================
-- Migration 0020: Reuniões privadas da coordenação
--
-- Nova coluna public.reunioes.visibilidade:
--   'equipa'  (default) — todos os membros veem (comportamento atual)
--   'coordenacao'       — apenas super_admins veem a reunião
--
-- Reuniões privadas: reuniões de coordenação internas (ex.: avaliação
-- de membros, assuntos sensíveis) convocadas só a super_admins, com
-- pauta/notas/ata fora do alcance do resto da equipa.
--
-- IMPORTANTE (recursão RLS): as policies usam SEMPRE o helper
-- security definer pode_ver_reuniao(uuid) — nunca uma subquery
-- direta a public.reuniao_participantes, que rebentaria com
-- "infinite recursion detected in policy".
-- =============================================================

-- 1) Coluna de visibilidade
alter table public.reunioes
  add column if not exists visibilidade text
  not null default 'equipa'
  check (visibilidade in ('equipa', 'coordenacao'));

-- 2) Helper: pode ver esta reunião? (security definer → sem recursão)
--    Regras: super_admin vê tudo; reunião 'equipa' vê qualquer
--    autenticado; reunião 'coordenacao' só super_admins.
create or replace function public.pode_ver_reuniao(p_reuniao_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select
      r.visibilidade = 'equipa'
      or public.minha_role() = 'super_admin'
    from public.reunioes r
    where r.id = p_reuniao_id
  ), false)
$$;

revoke all on function public.pode_ver_reuniao(uuid) from public;
grant execute on function public.pode_ver_reuniao(uuid) to authenticated;

-- 3) RLS de reunioes: substituir a policy de leitura "todos veem"
drop policy if exists "ler reunioes" on public.reunioes;
create policy "ler reunioes respeita visibilidade"
  on public.reunioes
  for select
  using (public.pode_ver_reuniao(id));

-- 4) RLS de participantes: quem não vê a reunião não pode ler os seus
--    convites (senão o título/nome vaza pelo join em obterReuniao).
drop policy if exists "ler participantes reuniao" on public.reuniao_participantes;
create policy "ler participantes respeita visibilidade"
  on public.reuniao_participantes
  for select
  using (public.pode_ver_reuniao(reuniao_id));

-- As restantes policies de reuniao_participantes (insert/update/delete)
-- já são super_admin-only ou self-only, sem vazamento — mantêm-se.

-- 5) Índice para o filtro de visibilidade
create index if not exists idx_reunioes_visibilidade
  on public.reunioes(visibilidade);
