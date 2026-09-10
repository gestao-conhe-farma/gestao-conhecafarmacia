-- =============================================================
-- Migration 0006: Detalhes de eventos/atividades
-- Local, materiais necessários, orçamento estimado e público
-- (alvo + n.º esperado) — enriquecem o planeamento de eventos.
-- Aplicáveis a qualquer atividade de topo; a UI destaca-os em
-- eventos e usa o local também nas entrevistas.
-- =============================================================

alter table public.atividades
  add column if not exists local text,
  add column if not exists materiais text,        -- um material por linha
  add column if not exists orcamento numeric(12, 2),
  add column if not exists publico_alvo text,
  add column if not exists publico_esperado integer;

-- Sem RLS novo: as policies existentes de atividades (leitura para
-- autenticados, escrita super_admin) cobrem as colunas novas.
