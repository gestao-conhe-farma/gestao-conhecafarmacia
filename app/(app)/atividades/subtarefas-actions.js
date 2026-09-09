'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Criar subtarefa. Admin (membro) ou super_admin.
 * Nasce sempre pendente_aprovacao (RLS impõe criado_por = auth.uid()).
 */
export async function criarSubtarefa(payload) {
  const { pessoa } = await getUtilizadorAtual()

  const { atividadeId, titulo, descricao, prazo, responsaveis } = payload
  if (!titulo?.trim()) return { ok: false, erro: 'O título é obrigatório.' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subtarefas')
    .insert({
      atividade_id: atividadeId || null,
      titulo: titulo.trim(),
      descricao: descricao || null,
      prazo: prazo || null,
      criado_por: pessoa.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, erro: error.message }
  const id = data.id

  if (responsaveis?.length) {
    const { error: errResp } = await supabase.from('subtarefa_responsaveis').insert(
      responsaveis.map((pessoa_id) => ({ subtarefa_id: id, pessoa_id }))
    )
    if (errResp) return { ok: false, erro: errResp.message }
  }

  revalidatePath('/')
  if (atividadeId) revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true, id }
}

/** Aprovar subtarefa (super_admin). */
export async function aprovarSubtarefa(id) {
  return decidir(id, 'aprovada')
}

/** Rejeitar subtarefa (super_admin). */
export async function rejeitarSubtarefa(id) {
  return decidir(id, 'rejeitada')
}

async function decidir(id, novoStatus) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('subtarefas')
    .update({ status: novoStatus, aprovado_por: pessoa.id, aprovado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pendente_aprovacao')

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/')
  revalidatePath('/aprovacoes')
  revalidatePath('/atividades')
  return { ok: true }
}

/** Marcar subtarefa aprovada como concluída. */
export async function concluirSubtarefa(id) {
  const { pessoa } = await getUtilizadorAtual()

  const supabase = await createClient()

  // Verificar permissão: criador, responsável ou super_admin
  const { data: sub } = await supabase
    .from('subtarefas')
    .select('id, status, criado_por, atividade_id, subtarefa_responsaveis(pessoa_id)')
    .eq('id', id)
    .single()

  if (!sub) return { ok: false, erro: 'Subtarefa não encontrada.' }
  if (sub.status !== 'aprovada') {
    return { ok: false, erro: 'Só subtarefas aprovadas podem ser concluídas.' }
  }

  const ehResponsavel = sub.subtarefa_responsaveis?.some((r) => r.pessoa_id === pessoa.id)
  if (pessoa.role !== 'super_admin' && sub.criado_por !== pessoa.id && !ehResponsavel) {
    return { ok: false, erro: 'Sem permissão para concluir esta subtarefa.' }
  }

  const { error } = await supabase
    .from('subtarefas')
    .update({ status: 'concluida' })
    .eq('id', id)

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/')
  if (sub.atividade_id) revalidatePath(`/atividades/${sub.atividade_id}`)
  return { ok: true }
}
