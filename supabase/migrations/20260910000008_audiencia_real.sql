-- =============================================================
-- Migration 0008: Audiência real dos eventos
-- Presenças reais registadas aquando da conclusão do evento, para
-- comparar com publico_esperado (migration 0006).
-- =============================================================

alter table public.atividades
  add column if not exists publico_real integer;
