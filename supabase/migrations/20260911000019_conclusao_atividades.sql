-- =============================================================
-- Migration 0019: conclusão de atividades/eventos/entrevistas pelo
-- responsável atribuído (paridade com o fluxo de subtarefas).
--
-- Até aqui só a coordenação (super_admin) podia mexer no estado de uma
-- atividade — incluindo eventos, via PainelEvento. Mas quando quem
-- realizou o trabalho é um membro, tem de poder dar o feedback
-- "está feito" sem esperar pela coordenação, tal como já acontece
-- com subtarefas (mudarEstadoSubtarefa).
--
-- Regras:
--  - O estado continua editável pela coordenação (policy existente).
--  - Agora o responsável atribuído (atividade_responsaveis) também pode
--    ATUALIZAR — é a app que limita o que ele muda (apenas status_evento).
-- =============================================================

drop policy if exists "super_admin edita atividades" on public.atividades;

create policy "super_admin edita atividades"
  on public.atividades
  for update
  using (public.minha_role() = 'super_admin');

create policy "responsavel atualiza estado atividade"
  on public.atividades
  for update
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.atividade_responsaveis r
      where r.atividade_id = id and r.pessoa_id = auth.uid()
    )
  );
