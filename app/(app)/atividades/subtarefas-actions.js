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

/** Rejeitar subtarefa (super_admin). Motivo obrigatório, visível só a super_admins. */
export async function rejeitarSubtarefa(id, motivo) {
  const texto = (motivo ?? '').trim()
  if (!texto) return { ok: false, erro: 'Explica o motivo da recusa — é obrigatório.' }

  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('subtarefas')
    .update({ status: 'rejeitada', aprovado_por: pessoa.id, aprovado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pendente_aprovacao')
  if (error) return { ok: false, erro: error.message }

  // Registo confidencial do motivo (RLS: só super_admins leem)
  const { error: errMotivo } = await supabase
    .from('subtarefa_recusas')
    .upsert(
      { subtarefa_id: id, motivo: texto, recusado_por: pessoa.id, recusado_em: new Date().toISOString() },
      { onConflict: 'subtarefa_id' }
    )
  if (errMotivo) return { ok: false, erro: errMotivo.message }

  revalidatePath('/')
  revalidatePath('/aprovacoes')
  revalidatePath('/atividades')
  return { ok: true }
}

/**
 * Editar uma subtarefa. O criador enquanto pendente; super_admin enquanto
 * não concluída. Campos: título, descrição, prazo e responsáveis.
 */
export async function editarSubtarefa(id, payload) {
  const { pessoa } = await getUtilizadorAtual()

  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subtarefas')
    .select('id, status, criado_por, atividade_id')
    .eq('id', id)
    .single()
  if (!sub) return { ok: false, erro: 'Subtarefa não encontrada.' }

  const podeEditar =
    pessoa.role === 'super_admin' ||
    (sub.criado_por === pessoa.id && sub.status === 'pendente_aprovacao')
  if (!podeEditar) {
    return { ok: false, erro: 'Só o criador (enquanto pendente) ou a coordenação podem editar.' }
  }

  const { titulo, descricao, prazo, responsaveis } = payload
  if (!titulo?.trim()) return { ok: false, erro: 'O título é obrigatório.' }

  const { error } = await supabase
    .from('subtarefas')
    .update({
      titulo: titulo.trim(),
      descricao: descricao || null,
      prazo: prazo || null,
    })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }

  // Responsáveis: sincroniza (apaga os que saíram, insere os que entraram)
  if (responsaveis !== undefined) {
    const { error: errResp } = await supabase
      .from('subtarefa_responsaveis')
      .delete()
      .eq('subtarefa_id', id)
    if (errResp) return { ok: false, erro: errResp.message }
    if (responsaveis.length) {
      const { error: errIns } = await supabase.from('subtarefa_responsaveis').insert(
        responsaveis.map((pessoa_id) => ({ subtarefa_id: id, pessoa_id }))
      )
      if (errIns) return { ok: false, erro: errIns.message }
    }
  }

  revalidatePath('/')
  if (sub.atividade_id) revalidatePath(`/atividades/${sub.atividade_id}`)
  return { ok: true }
}

/**
 * Eliminar uma subtarefa. O criador, enquanto pendente; super_admin sempre
 * (mesmo aprovada/concluída — registo some com as ligações, em cascata).
 */
export async function eliminarSubtarefa(id) {
  const { pessoa } = await getUtilizadorAtual()

  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subtarefas')
    .select('id, status, criado_por, atividade_id')
    .eq('id', id)
    .single()
  if (!sub) return { ok: false, erro: 'Subtarefa não encontrada.' }

  const podeApagar =
    pessoa.role === 'super_admin' ||
    (sub.criado_por === pessoa.id && sub.status === 'pendente_aprovacao')
  if (!podeApagar) {
    return { ok: false, erro: 'Só o criador (enquanto pendente) ou a coordenação podem eliminar.' }
  }

  const { error } = await supabase.from('subtarefas').delete().eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/')
  revalidatePath('/aprovacoes')
  if (sub.atividade_id) revalidatePath(`/atividades/${sub.atividade_id}`)
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

/**
 * Retrair uma recusa: volta a pendente_aprovacao (super_admin).
 * O motivo mantém-se guardado (histórico confidencial).
 */
export async function retratarRecusaSubtarefa(id) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subtarefas')
    .select('id, status, atividade_id')
    .eq('id', id)
    .single()
  if (!sub) return { ok: false, erro: 'Subtarefa não encontrada.' }
  if (sub.status !== 'rejeitada') {
    return { ok: false, erro: 'Só tarefas rejeitadas podem voltar a aprovação.' }
  }

  const { error } = await supabase
    .from('subtarefas')
    .update({ status: 'pendente_aprovacao', aprovado_por: null, aprovado_em: null })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/')
  revalidatePath('/aprovacoes')
  if (sub.atividade_id) revalidatePath(`/atividades/${sub.atividade_id}`)
  return { ok: true }
}
