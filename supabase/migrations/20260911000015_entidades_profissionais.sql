-- =============================================================
-- Migration 0015: Entidades (parceiros/patrocinadores) e
-- Profissionais externos (roster para entrevistas em TVs/rádios).
--
-- Ambas as tabelas são colaborativas: qualquer membro autenticado
-- lê, cria e edita — é memória institucional da equipa toda, não
-- da coordenação. Eliminação definitiva: só super_admin (evita
-- perder histórico por engano); membros usam ativo=false.
-- =============================================================

-- -------------------------------------------------------------
-- Entidades: parceiros, patrocinadores, instituições
-- -------------------------------------------------------------
create table if not exists public.entidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'parceiro' check (tipo in ('parceiro', 'patrocinador', 'instituicao', 'empresa')),
  area text,
  contacto_nome text,
  contacto_email text,
  contacto_telefone text,
  notas text,
  ativo boolean not null default true,
  criado_por uuid references public.pessoas(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.entidades enable row level security;

create policy "membros leem entidades" on public.entidades
  for select using (auth.uid() is not null);
create policy "membros criam entidades" on public.entidades
  for insert with check (auth.uid() is not null);
create policy "membros editam entidades" on public.entidades
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "coordenacao apaga entidades" on public.entidades
  for delete using (public.minha_role() = 'super_admin');

-- -------------------------------------------------------------
-- Profissionais externos: roster para convites a entrevistas
-- -------------------------------------------------------------
create table if not exists public.profissionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  profissao text,
  instituicao text,
  telefone text,
  email text,
  temas text[] not null default '{}',
  meios text[] not null default '{}',
  disponibilidade text,
  notas text,
  ativo boolean not null default true,
  criado_por uuid references public.pessoas(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.profissionais enable row level security;

create policy "membros leem profissionais" on public.profissionais
  for select using (auth.uid() is not null);
create policy "membros criam profissionais" on public.profissionais
  for insert with check (auth.uid() is not null);
create policy "membros editam profissionais" on public.profissionais
  for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "coordenacao apaga profissionais" on public.profissionais
  for delete using (public.minha_role() = 'super_admin');

create index if not exists idx_profissionais_ativo
  on public.profissionais(ativo, nome);

-- -------------------------------------------------------------
-- Ligações atividade ↔ entidade (parceria/patrocínio do evento)
-- -------------------------------------------------------------
create table if not exists public.atividade_entidades (
  atividade_id uuid references public.atividades(id) on delete cascade not null,
  entidade_id uuid references public.entidades(id) on delete cascade not null,
  papel text not null default 'parceiro' check (papel in ('parceiro', 'patrocinador')),
  primary key (atividade_id, entidade_id)
);

alter table public.atividade_entidades enable row level security;

create policy "membros leem ligacoes entidade" on public.atividade_entidades
  for select using (auth.uid() is not null);
create policy "membros gerem ligacoes entidade" on public.atividade_entidades
  for insert with check (auth.uid() is not null);
create policy "membros removem ligacoes entidade" on public.atividade_entidades
  for delete using (auth.uid() is not null);

-- -------------------------------------------------------------
-- Entrevistado externo: liga a atividade (entrevista) a um
-- profissional do roster. O entrevistado interno continua a ser
-- o equipa_member existente — isto cobre os convidados de fora.
-- -------------------------------------------------------------
create table if not exists public.atividade_profissionais (
  atividade_id uuid references public.atividades(id) on delete cascade not null,
  profissional_id uuid references public.profissionais(id) on delete cascade not null,
  primary key (atividade_id, profissional_id)
);

alter table public.atividade_profissionais enable row level security;

create policy "membros leem ligacoes profissional" on public.atividade_profissionais
  for select using (auth.uid() is not null);
create policy "membros gerem ligacoes profissional" on public.atividade_profissionais
  for insert with check (auth.uid() is not null);
create policy "membros removem ligacoes profissional" on public.atividade_profissionais
  for delete using (auth.uid() is not null);

create index if not exists idx_ativ_profissional
  on public.atividade_profissionais(profissional_id);
