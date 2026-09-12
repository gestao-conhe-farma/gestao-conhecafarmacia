-- =============================================================
-- Migration 0018: Tipos de notificação do painel de coordenação —
-- exclusivamente in-app (não entram no pipeline de email).
--
--  - subtarefa_pendente : subtarefa criada/editada à espera de
--    aprovação da coordenação.
--  - decisao_pendente   : decisão aprovada em reunião que ainda não
--    virou atividade — a coordenação é quem converte.
-- =============================================================

-- Sem schema change: os tipos vivem na coluna `tipo` da tabela
-- `notificacoes` (criada na 0014). Este comentário documenta o
-- contrato para consultas futuras.

comment on table public.notificacoes is
  'Notificacoes in-app. Tipos: convite_reuniao, reuniao_cancelada, ata_publicada, convite_entrevista, subtarefa_atribuida, subtarefa_pendente, decisao_pendente. Tipos _pendente sao apenas para super_admin.';
