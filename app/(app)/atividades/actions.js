'use server'

import { notificar, semAutor } from '@/lib/notificacoes'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Cria atividade/evento/entrevista de topo (só super_admin).
 * Nascem já aprovadas/visíveis.
 */
export async function criarAtividade(payload) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Sem permissão.' }
  }

  const { tipo, titulo, descricao, prazo, responsaveis, parent_id, participantes,
          local, materiais, orcamento, publico_alvo, publico_esperado } = payload
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
      local: local || null,
      orcamento: orcamento === null || orcamento === '' ? null : Number(orcamento),
      publico_alvo: publico_alvo || null,
      publico_esperado: publico_esperado === null || publico_esperado === '' ? null : Number(publico_esperado),
    })
    .select('id')
    .single()

  if (error) return { ok: false, erro: error.message }

  const atividadeId = data.id

  // Checklist de materiais (um item por linha do textarea)
  const itens = (materiais ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (itens.length) {
    const { error: errMat } = await supabase.from('atividade_materiais').insert(
      itens.map((nome, i) => ({ atividade_id: atividadeId, nome, ordem: i }))
    )
    if (errMat) return { ok: false, erro: errMat.message }
  }

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

    notificar(semAutor(participantes, pessoa.id), {
      tipo: 'entrevista_convite',
      titulo: `Convite para entrevista: ${titulo.trim()}`,
      corpo: prazo ? `Marcada para ${new Date(prazo).toLocaleString('pt-PT', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}` : null,
      link: `/atividades/${atividadeId}`,
    })
  }

  revalidatePath('/')
  revalidatePath('/atividades')
  return { ok: true, id: atividadeId }
}

/**
 * Editar detalhes de atividade/evento/entrevista (super_admin).
 * Altera só os campos descritivos — tipo, criador, estado e ligações
 * (parent, responsáveis, participantes) ficam intocados.
 */
export async function atualizarAtividade(atividadeId, payload) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const { titulo, descricao, prazo, local, materiais,
          orcamento, publico_alvo, publico_esperado,
          entidades, profissionalId } = payload
  if (!titulo?.trim()) return { ok: false, erro: 'O título é obrigatório.' }
  if (orcamento != null && (isNaN(Number(orcamento)) || Number(orcamento) < 0)) {
    return { ok: false, erro: 'Orçamento inválido.' }
  }
  if (publico_esperado != null && (isNaN(Number(publico_esperado)) || Number(publico_esperado) < 0)) {
    return { ok: false, erro: 'N.º de participantes esperados inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('atividades')
    .update({
      titulo: titulo.trim(),
      descricao: descricao || null,
      prazo: prazo || null,
      local: local || null,
      orcamento: orcamento === null || orcamento === '' ? null : Number(orcamento),
      publico_alvo: publico_alvo || null,
      publico_esperado: publico_esperado === null || publico_esperado === '' ? null : Number(publico_esperado),
    })
    .eq('id', atividadeId)

  if (error) return { ok: false, erro: error.message }

  // Entidades ligadas (parcerias/patrocínios): sincroniza a lista
  if (entidades !== undefined) {
    const { data: ligadas } = await supabase
      .from('atividade_entidades')
      .select('entidade_id')
      .eq('atividade_id', atividadeId)
    const idsAtuais = (ligadas ?? []).map((l) => l.entidade_id)
    const idsNovos = (entidades ?? []).map((e) => e.entidade_id)

    const aRemover = idsAtuais.filter((eid) => !idsNovos.includes(eid))
    if (aRemover.length) {
      await supabase
        .from('atividade_entidades')
        .delete()
        .eq('atividade_id', atividadeId)
        .in('entidade_id', aRemover)
    }

    // …e insere as que entraram (papel pode ter mudado)
    for (const e of entidades ?? []) {
      await supabase.from('atividade_entidades').upsert(
        { atividade_id: atividadeId, entidade_id: e.entidade_id, papel: e.papel ?? 'parceiro' },
        { onConflict: 'atividade_id,entidade_id' }
      )
    }
  }

  // Profissional externo entrevistado (entrevistas): 1 ou nenhum
  if (profissionalId !== undefined) {
    await supabase
      .from('atividade_profissionais')
      .delete()
      .eq('atividade_id', atividadeId)
    if (profissionalId) {
      const { error: errProf } = await supabase
        .from('atividade_profissionais')
        .insert({ atividade_id: atividadeId, profissional_id: profissionalId })
      if (errProf) return { ok: false, erro: errProf.message }
    }
  }

  // Materiais: sincroniza a checklist com o texto do formulário
  // (itens existentes mantêm o estado de marcação; por nome)
  if (materiais !== undefined) {
    const itens = (materiais ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const { data: atuais } = await supabase
      .from('atividade_materiais')
      .select('id, nome')
      .eq('atividade_id', atividadeId)
    const porNome = new Map((atuais ?? []).map((m) => [m.nome, m.id]))
    const manter = new Set(itens)

    // Remove os que saíram do texto
    const aRemover = (atuais ?? []).filter((m) => !manter.has(m.nome)).map((m) => m.id)
    if (aRemover.length) {
      await supabase.from('atividade_materiais').delete().in('id', aRemover)
    }

    // Insere os novos (os que já existem mantêm feito/feito_por)
    const novos = itens
      .filter((nome) => !porNome.has(nome))
      .map((nome, i) => ({ atividade_id: atividadeId, nome, ordem: i }))
    if (novos.length) {
      await supabase.from('atividade_materiais').insert(novos)
    }

    // Reordena
    for (const [i, nome] of itens.entries()) {
      const id = porNome.get(nome)
      if (id) await supabase.from('atividade_materiais').update({ ordem: i }).eq('id', id)
    }
  }

  revalidatePath(`/atividades/${atividadeId}`)
  revalidatePath('/atividades')
  revalidatePath('/')
  return { ok: true }
}

/**
 * Marca/desmarca um item do checklist de materiais (qualquer membro).
 * Fica registo de quem marcou e quando.
 */
export async function alternarMaterial(atividadeId, materialId, feito) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

  const supabase = await createClient()
  const { error } = await supabase
    .from('atividade_materiais')
    .update({
      feito,
      feito_por: feito ? pessoa.id : null,
      feito_em: feito ? new Date().toISOString() : null,
    })
    .eq('id', materialId)
    .eq('atividade_id', atividadeId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}
export async function convidarParticipantes(atividadeId, pessoaIds) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
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

  const { data: atividade } = await supabase
    .from('atividades')
    .select('titulo, prazo')
    .eq('id', atividadeId)
    .single()
  if (atividade) {
    notificar(semAutor(pessoaIds, pessoa.id), {
      tipo: 'entrevista_convite',
      titulo: `Convite para entrevista: ${atividade.titulo}`,
      corpo: atividade.prazo ? `Marcada para ${new Date(atividade.prazo).toLocaleString('pt-PT', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}` : null,
      link: `/atividades/${atividadeId}`,
    })
  }

  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}

/** O convidado confirma presença. */
export async function confirmarParticipacao(atividadeId) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

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

/**
 * O convidado desfaz a própria confirmação de presença.
 * O motivo é obrigatório e fica guardado separadamente
 * (entrevista_desconfirmacoes) — visível apenas ao próprio
 * participante e a super_admin.
 */
export async function desconfirmarParticipacao(atividadeId, motivo = null) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (!motivo || !motivo.trim()) {
    return { ok: false, erro: 'O justificativo é obrigatório.' }
  }

  const supabase = await createClient()

  const { data: registo } = await supabase
    .from('entrevista_participantes')
    .select('status')
    .eq('atividade_id', atividadeId)
    .eq('pessoa_id', pessoa.id)
    .single()

  if (!registo) return { ok: false, erro: 'Não foste convidado para esta entrevista.' }
  if (registo.status !== 'confirmado') {
    return { ok: false, erro: 'Ainda não confirmaste presença.' }
  }

  const texto = motivo.trim()

  const { error } = await supabase
    .from('entrevista_participantes')
    .update({ status: 'convidado' })
    .eq('atividade_id', atividadeId)
    .eq('pessoa_id', pessoa.id)

  if (error) return { ok: false, erro: error.message }

  const { error: errMotivo } = await supabase
    .from('entrevista_desconfirmacoes')
    .upsert(
      {
        atividade_id: atividadeId,
        pessoa_id: pessoa.id,
        motivo: texto,
      },
      { onConflict: 'atividade_id,pessoa_id' }
    )

  if (errMotivo) return { ok: false, erro: errMotivo.message }

  revalidatePath('/')
  revalidatePath('/entrevistas')
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}

/**
 * Marcar evento como concluído — sempre manual, só super_admin.
 * Regista a audiência real (publico_real) para comparar com a esperada.
 * Se não for passada, mantém a existente (ou fica sem registo).
 */
export async function concluirEvento(atividadeId, publicoReal = null) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (publicoReal != null && (isNaN(Number(publicoReal)) || Number(publicoReal) < 0)) {
    return { ok: false, erro: 'N.º de participantes real inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('atividades')
    .update({
      status_evento: 'concluida',
      publico_real: publicoReal === null || publicoReal === '' ? null : Number(publicoReal),
    })
    .eq('id', atividadeId)
    .eq('tipo', 'evento')

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/')
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}

/** Corrigir a audiência real de um evento já concluído (super_admin). */
export async function definirPublicoReal(atividadeId, publicoReal) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (publicoReal === null || publicoReal === '' || isNaN(Number(publicoReal)) || Number(publicoReal) < 0) {
    return { ok: false, erro: 'N.º de participantes real inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('atividades')
    .update({ publico_real: Number(publicoReal) })
    .eq('id', atividadeId)
    .eq('tipo', 'evento')

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}

/** Voltar a abrir evento (planeada/em_andamento). */
export async function reabrirEvento(atividadeId, novoEstado) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
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

/**
 * Concluir uma atividade/evento/entrevista — exclusivo da coordenação.
 * Os membros continuam a poder concluir as PRÓPRIAS subtarefas, mas
 * marcar o todo como concluído é decisão da coordenação (super_admin).
 * O estado (status_evento) é genérico na base de dados — vale para os
 * três tipos; eventos continuam a ter o PainelEvento com audiência real.
 */
export async function concluirAtividade(atividadeId) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Apenas a coordenação pode concluir atividades.' }

  const supabase = await createClient()
  const { data: atividade } = await supabase
    .from('atividades')
    .select('tipo')
    .eq('id', atividadeId)
    .single()

  if (!atividade) return { ok: false, erro: 'Atividade não encontrada.' }

  const { error } = await supabase
    .from('atividades')
    .update({ status_evento: 'concluida' })
    .eq('id', atividadeId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/')
  revalidatePath('/atividades')
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}

/**
 * Reabrir uma atividade concluída (desfazer conclusão).
 * Mesma permissão da conclusão: apenas coordenação.
 */
export async function reabrirAtividadeConcluida(atividadeId) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Apenas a coordenação pode concluir atividades.' }

  const supabase = await createClient()
  const { data: atividade } = await supabase
    .from('atividades')
    .select('tipo')
    .eq('id', atividadeId)
    .single()

  if (!atividade) return { ok: false, erro: 'Atividade não encontrada.' }

  const { error } = await supabase
    .from('atividades')
    .update({ status_evento: 'em_andamento' })
    .eq('id', atividadeId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/')
  revalidatePath('/atividades')
  revalidatePath(`/atividades/${atividadeId}`)
  return { ok: true }
}
