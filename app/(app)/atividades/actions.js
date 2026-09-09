'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Cria atividade/evento/entrevista de topo (só super_admin).
 * Nascem já aprovadas/visíveis.
 */
export async function criarAtividade(payload) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Sem permissão.' }
  }

  const { tipo, titulo, descricao, prazo, responsaveis, parent_id, participantes } = payload
  if (!titulo?.trim()) return { ok: false, erro: 'O título é obrigatório.' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('atividades')
    .insert({
      titulo: titulo.trim(),
      descricao: descricao || null,
      tipo,
      prazo: prazo || null,
      criado_por: pessoa.id,
      parent_id: parent_id || null,
      status_evento: tipo === 'evento' ? 'planeada' : null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, erro: error.message }

  const atividadeId = data.id

  // Responsáveis
  if (responsaveis?.length) {
    const { error: errResp } = await supabase.from('atividade_responsaveis').insert(
      responsaveis.map((pessoa_id) => ({ atividade_id: atividadeId, pessoa_id }))
    )
    if (errResp) return { ok: false, erro: errResp.message }
  }

  // Participantes da entrevista
  if (tipo === 'entrevista' && participantes?.length) {
    const { error: errPart } = await supabase.from('entrevista_participantes').insert(
      participantes.map((pessoa_id) => ({
        atividade_id: atividadeId,
        pessoa_id,
        status: 'convidado',
      }))
    )
    if (errPart) return { ok: false, erro: errPart.message }
  }

  revalidatePath('/')
  revalidatePath('/atividades')
  return { ok: true, id: atividadeId }
}

/** Convidar mais participantes para uma entrevista (super_admin). */
export async function convidarParticipantes(atividadeId, pessoaIds) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase.from('entrevista_participantes').upsert(
    pessoaIds.map((pessoa_id) => ({
      atividade_id: atividadeId,
      pessoa_id,
      status: 'convidado',
    })),
    { onConflict: 'atividade_id,pessoa_id', ignoreDuplicates: true }
  )

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}

/** O convidado confirma presença. */
export async function confirmarParticipacao(atividadeId) {
  const { pessoa } = await getUtilizadorAtual()

  const supabase = await createClient()
  const { error } = await supabase
    .from('entrevista_participantes')
    .update({ status: 'confirmado' })
    .eq('atividade_id', atividadeId)
    .eq('pessoa_id', pessoa.id)

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/')
  revalidatePath('/entrevistas')
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}

/** Marcar evento como concluído — sempre manual, só super_admin. */
export async function concluirEvento(atividadeId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('atividades')
    .update({ status_evento: 'concluida' })
    .eq('id', atividadeId)
    .eq('tipo', 'evento')

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/')
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}

/** Voltar a abrir evento (planeada/em_andamento). */
export async function reabrirEvento(atividadeId, novoEstado) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('atividades')
    .update({ status_evento: novoEstado })
    .eq('id', atividadeId)
    .eq('tipo', 'evento')

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}
