-- =============================================================
-- Migration 0016: prazo nos planos de reunião.
-- Decisões aprovadas podem nascer já com data-alvo; na conversão,
-- o prazo propaga-se para a atividade/evento gerado.
-- =============================================================

alter table public.reuniao_planos
  add column if not exists prazo timestamptz;

-- (redundante por segurança: se a coluna foi criada antes sem índice)
create index if not exists idx_planos_pendentes_conversao
  on public.reuniao_planos(decisao, atividade_id);
