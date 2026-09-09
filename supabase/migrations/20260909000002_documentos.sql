-- =============================================================
-- Migration 0002: Documentos (biblioteca oficial)
-- Categorias geríveis + documentos com visibilidade restrita.
-- Ficheiros num bucket PRIVADO 'documentos'.
-- =============================================================

-- Categorias (geríveis pela coordenação)
create table if not exists public.doc_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  criado_em timestamptz default now()
);

-- Documentos
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  categoria_id uuid references public.doc_categorias(id) on delete set null,
  codigo text, -- ex.: CF-PAR-001-2026 (opcional, manual)
  storage_path text not null unique, -- key no bucket 'documentos'
  nome_ficheiro text not null, -- nome original para download
  mime_type text,
  tamanho_bytes bigint,
  restrito boolean not null default false, -- true = só coordenação vê
  criado_por uuid references public.pessoas(id) not null,
  criado_em timestamptz default now()
);

create index if not exists idx_documentos_categoria on public.documentos(categoria_id);
create index if not exists idx_documentos_codigo on public.documentos(codigo);
create index if not exists idx_documentos_restrito on public.documentos(restrito);

-- =============================================================
-- Bucket privado (50MB)
-- =============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 52428800)
on conflict (id) do nothing;

-- =============================================================
-- RLS
-- =============================================================
alter table public.doc_categorias enable row level security;
alter table public.documentos enable row level security;

-- Categorias: todos leem; coordenação gere
create policy "ler categorias" on public.doc_categorias
  for select using (auth.uid() is not null);

create policy "super_admin gere categorias" on public.doc_categorias
  for all using (public.minha_role() = 'super_admin')
  with check (public.minha_role() = 'super_admin');

-- Documentos: restritos só para super_admin; escrita só super_admin
create policy "ler documentos" on public.documentos
  for select using (
    auth.uid() is not null
    and (restrito = false or public.minha_role() = 'super_admin')
  );

create policy "super_admin cria documentos" on public.documentos
  for insert with check (public.minha_role() = 'super_admin');

create policy "super_admin edita documentos" on public.documentos
  for update using (public.minha_role() = 'super_admin');

create policy "super_admin apaga documentos" on public.documentos
  for delete using (public.minha_role() = 'super_admin');

-- =============================================================
-- Storage: policies no bucket 'documentos'
-- =============================================================
create policy "super_admin carrega documentos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos' and public.minha_role() = 'super_admin');

create policy "super_admin apaga ficheiros documentos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos' and public.minha_role() = 'super_admin');

-- Leitura: só ficheiros com registo na BD visível ao utilizador
create policy "ler ficheiros visiveis" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.documentos d
      where d.storage_path = objects.name
        and (d.restrito = false or public.minha_role() = 'super_admin')
    )
  );

-- =============================================================
-- Seed: categorias iniciais (espelham a pasta do utilizador)
-- =============================================================
insert into public.doc_categorias (nome) values
  ('Cartas e Ofícios'),
  ('Conteúdos'),
  ('Contratos e Acordos'),
  ('Equipa'),
  ('Ideias'),
  ('Políticas e Termos')
on conflict (nome) do nothing;
