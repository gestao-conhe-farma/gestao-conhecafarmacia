-- =============================================================
-- Migration 0027: conclusão de atividades exclusiva da coordenação
--
-- A migration 0019 abriu o estado das atividades ao responsável
-- atribuído (paridade com subtarefas). Na prática, concluir o TODO
-- (atividade/evento/entrevista) passou a aparecer a membros — e a
-- decisão da coordenação é que isso é papel dela: os membros continuam
-- a poder concluir as PRÓPRIAS subtarefas, mas não o evento/atividade
-- inteiro.
--
-- Revoga a policy de update do responsável; fica apenas a policy da
-- coordenação ("super_admin edita atividades"), que continua ativa.
-- =============================================================

drop policy if exists "responsavel atualiza estado atividade" on public.atividades;

-- Nota: o SELECT da policy "ler atividades" (init) não é afetado —
-- os membros continuam a VER as atividades; só não as podem concluir.
