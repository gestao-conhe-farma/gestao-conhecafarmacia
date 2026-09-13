'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notificar, notificarCoordenacao, semAutor } from '@/lib/notificacoes'

/**
 * Criar subtarefa. Admin (membro) ou super_admin.
 * Nasce sempre pendente_aprovacao (RLS impõe criado_por = auth.uid()).
 */
export async function criarSubtarefa(payload) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

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

    notificar(semAutor(responsaveis, pessoa.id), {
      tipo: 'subtarefa_atribuida',
      titulo: `Nova tarefa: ${titulo.trim()}`,
      corpo: 'Foste atribuído a uma subtarefa.',
      link: atividadeId ? `/atividades/${atividadeId}` : '/',
    })
  }

  // Painel da coordenação (apenas in-app): há uma aprovação à espera
  if (pessoa.role !== 'super_admin') {
    notificarCoordenacao(pessoa.id, {
      tipo: 'subtarefa_pendente',
      titulo: 'Tarefa à espera de aprovação',
      corpo: `${pessoa.nome} criou "${titulo.trim()}".`,
      link: atividadeId ? `/atividades/${atividadeId}` : '/aprovacoes',
    })
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

  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
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
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

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

  // Se continuou pendente (o criador editou a proposta), avisa de novo
  // a coordenação — o título/dados podem ter mudado
  if (sub.status === 'pendente_aprovacao' && pessoa.role !== 'super_admin') {
    notificarCoordenacao(pessoa.id, {
      tipo: 'subtarefa_pendente',
      titulo: 'Tarefa à espera de aprovação',
      corpo: `${pessoa.nome} atualizou "${titulo.trim()}".`,
      link: sub.atividade_id ? `/atividades/${sub.atividade_id}` : '/aprovacoes',
    })
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
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

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

/**
 * Mudar estado de uma subtarefa por um responsável atribuído
 * ou pelo criador. Estados permitidos: concluida, cancelada, erro.
 * O motivo (caixa de relatório) é obrigatório e fica guardado em
 * subtarefa_estado_motivos — visível apenas ao próprio autor
 * e a super_admin.
 */
export async function mudarEstadoSubtarefa(id, estado, motivo = null) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (!['concluida', 'cancelada', 'erro'].includes(estado)) {
    return { ok: false, erro: 'Estado inválido.' }
  }
  if (!motivo || !motivo.trim()) {
    return { ok: false, erro: 'O justificativo é obrigatório.' }
  }

  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('subtarefas')
    .select('id, status, criado_por, atividade_id, subtarefa_responsaveis(pessoa_id)')
    .eq('id', id)
    .single()

  if (!sub) return { ok: false, erro: 'Subtarefa não encontrada.' }

  const responsavelIds = sub.subtarefa_responsaveis?.map((r) => r.pessoa_id) ?? []
  const eResponsavel = responsavelIds.includes(pessoa.id)
  const eCriador = sub.criado_por === pessoa.id

  if (pessoa.role !== 'super_admin' && !eResponsavel && !eCriador) {
    return { ok: false, erro: 'Só podes mexer em subtarefas atribuídas a ti ou criadas por ti.' }
  }

  // super_admin pode sempre; criador/responsável só quando a subtarefa
  // está aprovada ou já num estado final (para corrigir).
  const podeMudarEstado =
    pessoa.role === 'super_admin' ||
    ['aprovada', 'concluida', 'cancelada', 'erro'].includes(sub.status)

  if (!podeMudarEstado) {
    return { ok: false, erro: 'Só podes alterar o estado de subtarefas aprovadas.' }
  }

  const { error } = await supabase
    .from('subtarefas')
    .update({ status: estado })
    .eq('id', id)

  if (error) return { ok: false, erro: error.message }

  const { error: errMotivo } = await supabase
    .from('subtarefa_estado_motivos')
    .upsert(
      {
        subtarefa_id: id,
        pessoa_id: pessoa.id,
        estado_novo: estado,
        motivo: motivo.trim(),
      },
      { onConflict: 'subtarefa_id,pessoa_id,estado_novo' }
    )

  if (errMotivo) return { ok: false, erro: errMotivo.message }

  revalidatePath('/')
  if (sub.atividade_id) revalidatePath(`/atividades/${sub.atividade_id}`)
  return { ok: true }
}

/**
 * Marcar subtarefa aprovada como concluída (atalho para mudarEstadoSubtarefa).
 */
export async function concluirSubtarefa(id, motivo = null) {
  return mudarEstadoSubtarefa(id, 'concluida', motivo)
}

/**
 * Recusar a própria atribuição a uma subtarefa (desconfirmação).
 * O responsável atribuído sai da subtarefa e regista um justificativo
 * obrigatório — privado: só o autor e a coordenação (super_admin) leem.
 */
export async function desconfirmarAtribuicaoSubtarefa(id, motivo = null) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  const texto = (motivo ?? '').trim()
  if (!texto) {
    return { ok: false, erro: 'O justificativo é obrigatório.' }
  }

  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subtarefas')
    .select('id, status, atividade_id, subtarefa_responsaveis(pessoa_id)')
    .eq('id', id)
    .single()

  if (!sub) return { ok: false, erro: 'Subtarefa não encontrada.' }
  if (!['aprovada', 'concluida', 'cancelada', 'erro'].includes(sub.status)) {
    return { ok: false, erro: 'Só subtarefas aprovadas têm atribuição para recusar.' }
  }

  const eResponsavel = sub.subtarefa_responsaveis?.some((r) => r.pessoa_id === pessoa.id)
  if (!eResponsavel) {
    return { ok: false, erro: 'Esta subtarefa não está atribuída a ti.' }
  }

  // Guarda o justificativo antes de sair (RLS exige que ainda seja responsável)
  const { error: errMotivo } = await supabase
    .from('subtarefa_desconfirmacoes')
    .upsert(
      { subtarefa_id: id, pessoa_id: pessoa.id, motivo: texto },
      { onConflict: 'subtarefa_id,pessoa_id' }
    )
  if (errMotivo) return { ok: false, erro: errMotivo.message }

  const { error: errSaida } = await supabase
    .from('subtarefa_responsaveis')
    .delete()
    .eq('subtarefa_id', id)
    .eq('pessoa_id', pessoa.id)
  if (errSaida) return { ok: false, erro: errSaida.message }

  revalidatePath('/')
  if (sub.atividade_id) revalidatePath(`/atividades/${sub.atividade_id}`)
  return { ok: true }
}

/**
 * Retrair uma recusa: volta a pendente_aprovacao (super_admin).
 * O motivo mantém-se guardado (histórico confidencial).
 */
export async function retratarRecusaSubtarefa(id) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subtarefas')
    .select('id, titulo, status, atividade_id')
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

  // Painel da coordenação (apenas in-app): voltou a estar pendente
  notificarCoordenacao(pessoa.id, {
    tipo: 'subtarefa_pendente',
    titulo: 'Tarefa à espera de aprovação',
    corpo: `${pessoa.nome} retirou a recusa de "${sub.titulo}".`,
    link: sub.atividade_id ? `/atividades/${sub.atividade_id}` : '/aprovacoes',
  })

  revalidatePath('/')
  revalidatePath('/aprovacoes')
  if (sub.atividade_id) revalidatePath(`/atividades/${sub.atividade_id}`)
  return { ok: true }
}
