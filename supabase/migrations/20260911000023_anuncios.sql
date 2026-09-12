-- =============================================================
-- Migration 0023: Anúncios — avisos da coordenação para toda a equipa.
--
-- Aparecem numa banda destacada na homepage e em /anuncios (histórico).
-- Casos de uso: comunicados gerais e o resumo final de uma reunião
-- publicado também como anúncio (reuniao_id liga os dois).
--
-- Quem escreve: só super_admin (coordenação) — imposto por RLS e
-- revalidado na action. Leitura: toda a equipa autenticada.
-- =============================================================

create table if not exists public.anuncios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 200),
  corpo text not null check (char_length(corpo) between 1 and 4000),
  reuniao_id uuid references public.reunioes(id) on delete set null,
  criado_por uuid references public.pessoas(id) on delete set null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz,             -- opcional: deixa de destacar depois
  ativo boolean not null default true
);

alter table public.anuncios enable row level security;

-- Ler: todos os autenticados (anúncio é da equipa, não é segredo)
create policy "ler anuncios"
  on public.anuncios
  for select
  using (auth.uid() is not null);

-- Criar: só coordenação, sempre em nome próprio
create policy "super_admin cria anuncios"
  on public.anuncios
  for insert
  with check (
    public.minha_role() = 'super_admin'
    and criado_por = auth.uid()
  );

-- Editar/desativar/apagar: só coordenação
create policy "super_admin edita anuncios"
  on public.anuncios
  for update
  using (public.minha_role() = 'super_admin');

create policy "super_admin apaga anuncios"
  on public.anuncios
  for delete
  using (public.minha_role() = 'super_admin');

create index if not exists idx_anuncios_criado_em
  on public.anuncios(criado_em desc);
