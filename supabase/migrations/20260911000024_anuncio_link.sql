-- =============================================================
-- Migration 0024: Ligação opcional nos anúncios.
--
-- Um anúncio pode apontar para uma página interna (ex.: o guia da
-- plataforma em /guia). Restrito a caminhos internos na action —
-- nunca URLs externos nem javascript: (o valor entra num href).
-- =============================================================

alter table public.anuncios add column if not exists link text;
