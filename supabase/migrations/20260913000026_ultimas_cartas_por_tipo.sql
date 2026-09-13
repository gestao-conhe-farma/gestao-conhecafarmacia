-- =============================================================
-- Migration 0026: próximas cartas — último número por tipo
-- Painel na página de documentos: para cada tipo de carta (prefixo
-- CF-XXX), mostra a última emitida e qual o número seguinte a usar.
-- Lê a favor da equipa: a function roda como quem chama (não há
-- SECURITY DEFINER) — cada um vê apenas o que a RLS lhe deixa, e o
-- próximo número calculado respeita a mesma visibilidade.
-- =============================================================

create or replace function public.ultimas_cartas_por_tipo()
returns table (
  prefixo text,
  ultimo_codigo text,
  ultimo_titulo text,
  ultimo_numero integer,
  ultimo_ano integer,
  proximo_numero integer,
  proximo_codigo text,
  total integer
)
language sql
stable
as $$
  with visiveis as (
    select codigo, titulo, criado_em
    from public.documentos
    where codigo is not null
  ),
  partida as (
    select
      codigo,
      upper(split_part(codigo, '-', 1) || '-' || split_part(codigo, '-', 2)) as prefixo,
      split_part(codigo, '-', 3)::int as numero,
      split_part(codigo, '-', 4)::int as ano,
      titulo,
      criado_em
    from visiveis
    where codigo ~ '^CF-[A-Z]{3}-\d{1,4}-\d{4}$'
  ),
  ultimos as (
    select distinct on (prefixo)
      prefixo, codigo, titulo, numero, ano, criado_em
    from partida
    order by prefixo, ano desc, numero desc, criado_em desc
  ),
  atuais as (
    select
      u.prefixo,
      u.codigo as ultimo_codigo,
      u.titulo as ultimo_titulo,
      u.criado_em as ultimo_criado_em,
      u.numero as ultimo_numero,
      u.ano as ultimo_ano,
      case when u.ano = extract(year from now())::int then u.numero + 1 else 1 end as proximo_numero,
      count(*) over (partition by p.prefixo) as total
    from ultimos u
    left join partida p on p.prefixo = u.prefixo
  )
  select distinct
    a.prefixo,
    a.ultimo_codigo,
    a.ultimo_titulo,
    a.ultimo_numero,
    a.ultimo_ano,
    a.proximo_numero,
    a.prefixo || '-' || lpad(a.proximo_numero::text, 3, '0') || '-' || extract(year from now())::int as proximo_codigo,
    a.total::int
  from atuais a
  order by a.prefixo
$$;

grant execute on function public.ultimas_cartas_por_tipo() to authenticated;
