-- =============================================================
-- Migration 0017: Pipeline de conteúdo para redes sociais (item #3,
-- versão simplificada). Calendário editorial dos conteúdos que saem
-- no Facebook, TikTok, Instagram e YouTube.
--
-- Modelo:
--   - `conteudo_redes`: cada linha é um conteúdo com data de saída
--     fixa (data_publicacao), tema/título, plataforma e estado.
--   - O estado cobre o ciclo de produção: ideia → planeado → produzido
--     (gravado/editado) → agendado (na fila da plataforma) → publicado.
--   - `link_publicacao`: URL depois de sair (fica como arquivo).
--   - Deduplicação leve: uma plataforma não tem dois conteúdos no
--     mesmo dia com o mesmo título (índice único parcial).
--
-- RLS: quem está autenticado lê e escreve (equipa inteira alimenta
-- o calendário). Apagar é só da coordenação (super_admin) — preserva
-- histórico contra cliques errados; o campo `ativo` permite desativar
-- sem perder o registo.
-- =============================================================

create table if not exists public.conteudo_redes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  plataforma text not null check (plataforma in ('facebook','instagram','tiktok','youtube')),
  data_publicacao date not null,
  estado text not null default 'ideia'
    check (estado in ('ideia','planeado','produzido','agendado','publicado')),
  link_publicacao text,
  ativo boolean not null default true,
  criado_por uuid references public.pessoas(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.conteudo_redes enable row level security;

-- Equipa inteira lê
create policy "equipa le conteudo_redes" on public.conteudo_redes
  for select to authenticated using (true);

-- Equipa inteira escreve (admins criam/editam)
create policy "equipa cria conteudo_redes" on public.conteudo_redes
  for insert to authenticated with check (true);

create policy "equipa edita conteudo_redes" on public.conteudo_redes
  for update to authenticated using (true) with check (true);

-- Apagar: só coordenação
create policy "coordenacao apaga conteudo_redes" on public.conteudo_redes
  for delete to authenticated using (
    exists (
      select 1 from public.pessoas p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

-- Um tema por plataforma/dia (evita duplicados por duplo clique;
-- conteúdos diferentes no mesmo dia continuam permitidos)
create unique index if not exists uq_conteudo_redes_dia
  on public.conteudo_redes (plataforma, data_publicacao, titulo)
  where ativo = true;

create index if not exists idx_conteudo_redes_data
  on public.conteudo_redes (data_publicacao);

create index if not exists idx_conteudo_redes_estado
  on public.conteudo_redes (estado);
