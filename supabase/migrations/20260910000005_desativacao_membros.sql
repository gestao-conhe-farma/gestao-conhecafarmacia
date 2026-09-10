-- =============================================================
-- Migration 0005: Desativação de membros (soft-delete)
-- Remover um membro deixa de apagar o registo: a conta é desativada
-- (sem login) e sai da directoria, mas o histórico — notas de
-- reuniões, atividades, documentos — continua a mostrar o nome.
-- =============================================================

alter table public.pessoas
  add column if not exists ativo boolean not null default true;

-- Nota: a policy "ler equipa" mantém-se a permitir SELECT a todos os
-- autenticados, incluindo linhas inativas — é isso que permite os
-- joins (notas, criado_por, responsáveis) continuarem a resolver o
-- nome de quem já saiu. A ocultação na directoria é feita na app
-- (listarEquipa / obterPessoa filtram ativo = true). A escrita
-- continua reservada à Admin API (service_role).
