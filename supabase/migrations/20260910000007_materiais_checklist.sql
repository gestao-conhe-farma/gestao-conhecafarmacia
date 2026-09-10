-- =============================================================
-- Migration 0007: Checklist de materiais dos eventos
-- Cada material vira uma linha própria: pode ser marcado como
-- preparado por qualquer membro (fica quem marcou e quando).
-- A coluna atividades.materiais (texto livre, migration 0006) fica
-- obsoleta — o conteúdo existente é migrado para a tabela abaixo.
-- =============================================================

create table if not exists public.atividade_materiais (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid references public.atividades(id) not null,
  nome text not null,
  ordem int not null default 0,
  feito boolean not null default false,
  feito_por uuid references public.pessoas(id),
  feito_em timestamptz,
  criado_em timestamptz default now()
);

create index if not exists idx_materiais_atividade
  on public.atividade_materiais(atividade_id);

-- Backfill: linhas do texto antigo (uma por linha, ignora vazias),
-- só para atividades que ainda não têm itens na tabela (reexecutável).
insert into public.atividade_materiais (atividade_id, nome, ordem)
select
  a.id,
  trim(l.linha),
  (l.ord - 1)::int
from public.atividades a
cross join lateral unnest(string_to_array(a.materiais, E'\n')) with ordinality as l(linha, ord)
where a.materiais is not null
  and length(trim(l.linha)) > 0
  and not exists (
    select 1 from public.atividade_materiais m where m.atividade_id = a.id
  );

-- =============================================================
-- RLS: todos leem; qualquer membro marca/desmarca (tick);
-- adicionar/remover itens fica reservado à coordenação.
-- =============================================================
alter table public.atividade_materiais enable row level security;

create policy "ler materiais atividade" on public.atividade_materiais
  for select using (auth.uid() is not null);

create policy "super_admin gere materiais" on public.atividade_materiais
  for insert with check (public.minha_role() = 'super_admin');

create policy "super_admin remove materiais" on public.atividade_materiais
  for delete using (public.minha_role() = 'super_admin');

create policy "membro marca material" on public.atividade_materiais
  for update using (auth.uid() is not null);
