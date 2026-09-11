-- =============================================================
-- Migration 0011: Corrigir recursão infinita nas policies de subtarefas
--
-- A 0010 acrescentou às policies "ler subtarefas" / "editar subtarefas"
-- uma verificação direta em subtarefa_responsaveis. Como a policy de
-- leitura de subtarefa_responsaveis (migration 0001) consulta subtarefas,
-- criou-se um ciclo:
--   subtarefas → subtarefa_responsaveis → subtarefas → …
-- O Postgres deteta-o e devolve:
--   "infinite recursion detected in policy for relation
--    subtarefa_responsaveis"
--
-- Fix: função SECURITY DEFINER (mesmo padrão de minha_role()) que
-- responde "sou responsável desta subtarefa?" sem acionar o RLS da
-- tabela, quebrando o ciclo. As policies passam a chamá-la.
-- =============================================================

create or replace function public.eh_responsavel_subtarefa(p_subtarefa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subtarefa_responsaveis r
    where r.subtarefa_id = p_subtarefa_id
      and r.pessoa_id = auth.uid()
  )
$$;

-- A função só interessa a utilizadores autenticados.
revoke all on function public.eh_responsavel_subtarefa(uuid) from public;
grant execute on function public.eh_responsavel_subtarefa(uuid) to authenticated;

-- Leitura: estados finais visíveis a todos; criador, responsável
-- atribuído (via helper) e super_admin veem sempre.
drop policy if exists "ler subtarefas" on public.subtarefas;
create policy "ler subtarefas" on public.subtarefas
  for select using (
    status in ('aprovada', 'concluida', 'cancelada', 'erro')
    or criado_por = auth.uid()
    or public.minha_role() = 'super_admin'
    or public.eh_responsavel_subtarefa(id)
  );

-- Atualização: super_admin sempre; criador ou responsável atribuído
-- quando a subtarefa está aprovada (ou já em estado final, para
-- corrigir). O status nunca volta a pendente_aprovacao/rejeitada.
drop policy if exists "editar subtarefas" on public.subtarefas;
create policy "editar subtarefas" on public.subtarefas
  for update using (
    public.minha_role() = 'super_admin'
    or (criado_por = auth.uid() and status = 'pendente_aprovacao')
    or (
      status in ('aprovada', 'concluida', 'cancelada', 'erro')
      and (
        criado_por = auth.uid()
        or public.eh_responsavel_subtarefa(id)
      )
    )
  )
  with check (
    public.minha_role() = 'super_admin'
    or (criado_por = auth.uid() and status = 'pendente_aprovacao')
    or (
      status in ('aprovada', 'concluida', 'cancelada', 'erro')
      and (
        criado_por = auth.uid()
        or public.eh_responsavel_subtarefa(id)
      )
    )
  );
