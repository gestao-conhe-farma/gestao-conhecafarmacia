'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { BUCKET } from '@/lib/documentos'

/**
 * Ações da secção Reuniões.
 * Papéis: todos (admins) escrevem notas e votam; super_admin convoca,
 * marca presenças, escreve o resumo, decide planos e converte em
 * atividade/evento.
 */

async function ataPublicada(supabase, reuniaoId) {
  const { data } = await supabase
    .from('reunioes')
    .select('resumo_publicado_em')
    .eq('id', reuniaoId)
    .single()
  return Boolean(data?.resumo_publicado_em)
}

/** Próxima data pela regra configurada (semana_do_mes+dia_semana ou dia_do_mes). */
function proximaDataRegra(config, aPartirDe = new Date()) {
  const [h, m] = (config.hora || '18:00').split(':').map(Number)
  const base = new Date(aPartirDe)
  base.setHours(h, m || 0, 0, 0)

  if (config.dia_do_mes) {
    // Dia fixo do mês; se já passou este mês, avança para o próximo
    const d = new Date(base.getFullYear(), base.getMonth(), config.dia_do_mes, h, m || 0)
    if (d <= aPartirDe) d.setMonth(d.getMonth() + 1)
    return d
  }

  // n.ª ocorrência do dia da semana no mês (1.ª a 4.ª)
  const alvo = config.dia_semana ?? 1
  const ano = base.getFullYear()
  let mes = base.getMonth()
  for (let tent = 0; tent < 3; tent++) {
    const primeiro = new Date(ano, mes, 1, h, m || 0)
    const desvio = (alvo - primeiro.getDay() + 7) % 7
    const d = new Date(ano, mes, 1 + desvio + 7 * ((config.semana_do_mes ?? 1) - 1), h, m || 0)
    if (d.getMonth() === mes && d > aPartirDe) return d
    mes++
  }
  return null
}

/** Aplica a regra mensal: cria as próximas N reuniões que ainda não existem. */
async function gerarMensais(supabase, config, quantidade = 3) {
  if (!config?.ativa) return 0
  // referência: última reunião mensal existente, ou agora
  const { data: ultima } = await supabase
    .from('reunioes')
    .select('data_hora')
    .eq('tipo', 'mensal')
    .order('data_hora', { ascending: false })
    .limit(1)
    .maybeSingle()

  let criadas = 0
  let ref = ultima?.data_hora ? new Date(ultima.data_hora) : new Date()
  for (let i = 0; i < quantidade; i++) {
    const d = proximaDataRegra(config, ref)
    if (!d) break
    // evita duplicados: já existe reunião mensal nessa data?
    const { count } = await supabase
      .from('reunioes')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', 'mensal')
      .gte('data_hora', new Date(d.getTime() - 60000).toISOString())
      .lte('data_hora', new Date(d.getTime() + 60000).toISOString())
    if (count === 0) {
      const titulo = `Reunião mensal — ${d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`
      const { data: nova } = await supabase
        .from('reunioes')
        .insert({
          titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1),
          tipo: 'mensal',
          data_hora: d.toISOString(),
          local: config.local || null,
          criado_por: (await getUtilizadorAtual()).pessoa.id,
        })
        .select('id')
        .maybeSingle()
      if (nova) criadas++
    }
    ref = d
  }
  return criadas
}

/** Criar reunião (super_admin). Se mensal, aplica a regra configurada. */
export async function criarReuniao(payload) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const { titulo, tipo, dataHora, local, pauta, participantes } = payload
  if (!titulo?.trim()) return { ok: false, erro: 'O título é obrigatório.' }
  if (!dataHora) return { ok: false, erro: 'A data e hora são obrigatórias.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reunioes')
    .insert({
      titulo: titulo.trim(),
      tipo: tipo === 'urgente' ? 'urgente' : 'mensal',
      data_hora: dataHora,
      local: local?.trim() || null,
      pauta: pauta?.trim() || null,
      criado_por: pessoa.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, erro: error.message }

  if (participantes?.length) {
    const { error: errPart } = await supabase.from('reuniao_participantes').insert(
      participantes.map((pessoa_id) => ({ reuniao_id: data.id, pessoa_id, status: 'convidado' }))
    )
    if (errPart) return { ok: false, erro: errPart.message }
  }

  revalidatePath('/reunioes')
  return { ok: true, id: data.id }
}

/** Gerar as próximas reuniões mensais pela regra configurada (super_admin). */
export async function gerarReunioesMensais() {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { data: config } = await supabase
    .from('reuniao_configuracao')
    .select('*')
    .eq('id', 1)
    .single()

  const criadas = await gerarMensais(supabase, config)
  revalidatePath('/reunioes')
  return { ok: true, criadas }
}

/** Guardar a regra de recorrência (super_admin). */
export async function guardarConfiguracaoReunioes(config) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const { ativa, modo, semanaDoMes, diaSemana, diaDoMes, hora, local } = config
  if (ativa) {
    if (modo === 'semana' && !(semanaDoMes >= 1 && semanaDoMes <= 4))
      return { ok: false, erro: 'Escolhe a semana do mês (1.ª a 4.ª).' }
    if (modo === 'dia' && !(diaDoMes >= 1 && diaDoMes <= 31))
      return { ok: false, erro: 'Escolhe o dia do mês (1 a 31).' }
    if (!hora) return { ok: false, erro: 'Define a hora da reunião.' }
  }

  const supabase = await createClient()
  const linha = {
    ativa: Boolean(ativa),
    semana_do_mes: modo === 'semana' ? semanaDoMes : null,
    dia_semana: modo === 'semana' ? diaSemana : null,
    dia_do_mes: modo === 'dia' ? diaDoMes : null,
    hora: hora || '18:00',
    local: local?.trim() || null,
    atualizado_em: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('reuniao_configuracao')
    .upsert({ id: 1, ...linha })

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/reunioes')
  return { ok: true }
}

/** Convocar mais pessoas (super_admin). */
export async function convocarParticipantes(reuniaoId, pessoaIds) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase.from('reuniao_participantes').upsert(
    pessoaIds.map((pessoa_id) => ({ reuniao_id: reuniaoId, pessoa_id, status: 'convidado' })),
    { onConflict: 'reuniao_id,pessoa_id', ignoreDuplicates: true }
  )
  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/**
 * Editar os detalhes de uma reunião (super_admin): título, tipo, data/hora,
 * local e pauta. Bloqueado depois de a ata ser publicada — o registo fica
 * imutável como documento oficial.
 */
export async function editarReuniao(reuniaoId, payload) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  if (await ataPublicada(supabase, reuniaoId)) {
    return { ok: false, erro: 'A ata já foi publicada — os detalhes da reunião estão fechados.' }
  }

  const { titulo, tipo, dataHora, local, pauta } = payload
  if (!titulo?.trim()) return { ok: false, erro: 'O título é obrigatório.' }
  if (!dataHora) return { ok: false, erro: 'A data e hora são obrigatórias.' }

  const { error } = await supabase
    .from('reunioes')
    .update({
      titulo: titulo.trim(),
      tipo: tipo === 'urgente' ? 'urgente' : 'mensal',
      data_hora: dataHora,
      local: local?.trim() || null,
      pauta: pauta?.trim() || null,
    })
    .eq('id', reuniaoId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  revalidatePath('/reunioes')
  return { ok: true }
}

/**
 * Retirar o convite de um participante (super_admin). Só é possível
 * enquanto a presença não foi registada e a ata não foi publicada.
 */
export async function removerParticipante(reuniaoId, pessoaId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (pessoaId === pessoa.id) {
    return { ok: false, erro: 'Não podes retirar o teu próprio convite.' }
  }

  const supabase = await createClient()
  if (await ataPublicada(supabase, reuniaoId)) {
    return { ok: false, erro: 'A ata já foi publicada — os convocados estão fechados.' }
  }

  const { data: registo } = await supabase
    .from('reuniao_participantes')
    .select('presenca')
    .eq('reuniao_id', reuniaoId)
    .eq('pessoa_id', pessoaId)
    .single()
  if (!registo) return { ok: false, erro: 'Convite não encontrado.' }
  if (registo.presenca) {
    return { ok: false, erro: 'A presença deste membro já foi registada — não pode ser retirado.' }
  }

  const { error } = await supabase
    .from('reuniao_participantes')
    .delete()
    .eq('reuniao_id', reuniaoId)
    .eq('pessoa_id', pessoaId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/** O convocado confirma presença (antes da reunião). */
export async function confirmarPresencaReuniao(reuniaoId) {
  const { pessoa } = await getUtilizadorAtual()

  const supabase = await createClient()
  const { error } = await supabase
    .from('reuniao_participantes')
    .update({ status: 'confirmado' })
    .eq('reuniao_id', reuniaoId)
    .eq('pessoa_id', pessoa.id)

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  revalidatePath('/reunioes')
  return { ok: true }
}

/**
 * O convocado desfaz a própria confirmação (antes da reunião).
 * O motivo é obrigatório e fica guardado em
 * reuniao_desconfirmacoes — visível apenas ao próprio
 * participante e a super_admin.
 */
export async function desconfirmarPresencaReuniao(reuniaoId, motivo = null) {
  const { pessoa } = await getUtilizadorAtual()
  if (!motivo || !motivo.trim()) {
    return { ok: false, erro: 'O justificativo é obrigatório.' }
  }

  const supabase = await createClient()
  const { data: registo } = await supabase
    .from('reuniao_participantes')
    .select('status, presenca')
    .eq('reuniao_id', reuniaoId)
    .eq('pessoa_id', pessoa.id)
    .single()

  if (!registo) return { ok: false, erro: 'Não estás convocado para esta reunião.' }
  if (registo.presenca) {
    return { ok: false, erro: 'A tua presença já foi registada pela coordenação — fala com eles.' }
  }
  if (registo.status !== 'confirmado') {
    return { ok: false, erro: 'Ainda não confirmaste presença.' }
  }

  const texto = motivo.trim()

  const { error } = await supabase
    .from('reuniao_participantes')
    .update({ status: 'convidado' })
    .eq('reuniao_id', reuniaoId)
    .eq('pessoa_id', pessoa.id)

  if (error) return { ok: false, erro: error.message }

  const { error: errMotivo } = await supabase
    .from('reuniao_desconfirmacoes')
    .upsert(
      {
        reuniao_id: reuniaoId,
        pessoa_id: pessoa.id,
        motivo: texto,
      },
      { onConflict: 'reuniao_id,pessoa_id' }
    )

  if (errMotivo) return { ok: false, erro: errMotivo.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  revalidatePath('/reunioes')
  return { ok: true }
}

/** Marcar presença (presente/ausente/justificado) — super_admin, após a reunião. */
export async function marcarPresenca(reuniaoId, pessoaId, presenca) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reuniao_participantes')
    .update({ presenca: presenca || null })
    .eq('reuniao_id', reuniaoId)
    .eq('pessoa_id', pessoaId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/** Nota da equipa (todos; bloqueada quando a ata está publicada). */
export async function adicionarNota(reuniaoId, conteudo) {
  const { pessoa } = await getUtilizadorAtual()
  const texto = (conteudo ?? '').trim()
  if (!texto) return { ok: false, erro: 'A nota está vazia.' }

  const supabase = await createClient()
  if (await ataPublicada(supabase, reuniaoId)) {
    return { ok: false, erro: 'A ata já foi publicada — as notas estão fechadas.' }
  }

  const { error } = await supabase
    .from('reuniao_notas')
    .insert({ reuniao_id: reuniaoId, autor_id: pessoa.id, conteudo: texto })

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/** Editar a própria nota (enquanto a ata não saiu). */
export async function editarNota(reuniaoId, notaId, conteudo) {
  const { pessoa } = await getUtilizadorAtual()
  const texto = (conteudo ?? '').trim()
  if (!texto) return { ok: false, erro: 'A nota está vazia.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reuniao_notas')
    .update({ conteudo: texto, editado_em: new Date().toISOString() })
    .eq('id', notaId)
    .eq('autor_id', pessoa.id)

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/** Apagar nota: o autor (enquanto aberta) ou o super_admin (sempre — moderação). */
export async function apagarNota(reuniaoId, notaId) {
  const { pessoa } = await getUtilizadorAtual()

  const supabase = await createClient()
  const { data: nota } = await supabase
    .from('reuniao_notas')
    .select('autor_id')
    .eq('id', notaId)
    .single()
  if (!nota) return { ok: false, erro: 'Nota não encontrada.' }

  const ehAutor = nota.autor_id === pessoa.id
  const publicada = await ataPublicada(supabase, reuniaoId)
  if (!publicada && !ehAutor && pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Sem permissão.' }
  }
  if (publicada && pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'A ata foi publicada — as notas estão fechadas.' }
  }

  const { error } = await supabase.from('reuniao_notas').delete().eq('id', notaId)
  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/** Criar plano (super_admin). */
export async function criarPlano(reuniaoId, { titulo, descricao }) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (!titulo?.trim()) return { ok: false, erro: 'O título do plano é obrigatório.' }

  const supabase = await createClient()
  const { error } = await supabase.from('reuniao_planos').insert({
    reuniao_id: reuniaoId,
    titulo: titulo.trim(),
    descricao: descricao?.trim() || null,
    criado_por: pessoa.id,
  })
  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/** Votar num plano: favor/contra/abstencao (qualquer membro). */
export async function votarPlano(planoId, voto) {
  const { pessoa } = await getUtilizadorAtual()
  if (!['favor', 'contra', 'abstencao'].includes(voto)) {
    return { ok: false, erro: 'Voto inválido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('reuniao_plano_votos').upsert(
    { plano_id: planoId, pessoa_id: pessoa.id, voto, votado_em: new Date().toISOString() },
    { onConflict: 'plano_id,pessoa_id' }
  )
  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

/** Retirar o próprio voto. */
export async function retirarVoto(planoId) {
  const { pessoa } = await getUtilizadorAtual()
  const supabase = await createClient()
  const { error } = await supabase
    .from('reuniao_plano_votos')
    .delete()
    .eq('plano_id', planoId)
    .eq('pessoa_id', pessoa.id)
  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

/** Aprovar/rejeitar plano (super_admin). */
export async function decidirPlano(reuniaoId, planoId, decisao) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (!['aprovado', 'rejeitado', 'pendente'].includes(decisao)) {
    return { ok: false, erro: 'Decisão inválida.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reuniao_planos')
    .update({
      decisao,
      decidido_por: decisao === 'pendente' ? null : pessoa.id,
      decidido_em: decisao === 'pendente' ? null : new Date().toISOString(),
    })
    .eq('id', planoId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/**
 * Converter plano aprovado em atividade/evento (super_admin).
 * Mini-form: tipo, prazo, responsáveis. Fica ligado à reunião (reuniao_origem).
 */
export async function converterPlano(reuniaoId, planoId, { tipo, prazo, responsaveis }) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { data: plano } = await supabase
    .from('reuniao_planos')
    .select('titulo, descricao, decisao, atividade_id')
    .eq('id', planoId)
    .single()

  if (!plano) return { ok: false, erro: 'Plano não encontrado.' }
  if (plano.decisao !== 'aprovado') {
    return { ok: false, erro: 'Só planos aprovados podem ser convertidos.' }
  }
  if (plano.atividade_id) return { ok: false, erro: 'Este plano já foi convertido.' }

  const { data: atividade, error } = await supabase
    .from('atividades')
    .insert({
      titulo: plano.titulo,
      descricao: plano.descricao,
      tipo: tipo === 'evento' ? 'evento' : 'atividade',
      prazo: prazo || null,
      criado_por: pessoa.id,
      status_evento: tipo === 'evento' ? 'planeada' : null,
      reuniao_origem: reuniaoId,
    })
    .select('id')
    .single()

  if (error) return { ok: false, erro: error.message }

  if (responsaveis?.length) {
    const { error: errResp } = await supabase.from('atividade_responsaveis').insert(
      responsaveis.map((pessoa_id) => ({ atividade_id: atividade.id, pessoa_id }))
    )
    if (errResp) return { ok: false, erro: errResp.message }
  }

  const { error: errPlano } = await supabase
    .from('reuniao_planos')
    .update({ atividade_id: atividade.id })
    .eq('id', planoId)
  if (errPlano) return { ok: false, erro: errPlano.message }

  revalidatePath(`/reunioes/${reuniaoId}`)
  revalidatePath('/atividades')
  revalidatePath('/')
  return { ok: true, id: atividade.id }
}

/** Publicar resumo final (super_admin) — congela as notas. */
export async function publicarResumo(reuniaoId, resumo) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  const texto = (resumo ?? '').trim()
  if (!texto) return { ok: false, erro: 'Escreve o resumo antes de publicar.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reunioes')
    .update({
      resumo: texto,
      resumo_publicado_em: new Date().toISOString(),
      estado: 'realizada',
    })
    .eq('id', reuniaoId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  revalidatePath('/reunioes')
  return { ok: true }
}

/** Guardar rascunho do resumo sem publicar (super_admin). */
export async function guardarRascunhoResumo(reuniaoId, resumo) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reunioes')
    .update({ resumo: (resumo ?? '').trim() || null })
    .eq('id', reuniaoId)
  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/** Cancelar reunião (super_admin). */
export async function cancelarReuniao(reuniaoId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reunioes')
    .update({ estado: 'cancelada' })
    .eq('id', reuniaoId)
  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  revalidatePath('/reunioes')
  return { ok: true }
}

/** Marcar reunião como realizada sem publicar ata (super_admin). */
export async function marcarRealizada(reuniaoId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('reunioes')
    .update({ estado: 'realizada' })
    .eq('id', reuniaoId)
  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  revalidatePath('/reunioes')
  return { ok: true }
}

/** Registar anexo após upload para o Storage (super_admin). */
export async function registarAnexoReuniao(reuniaoId, { storagePath, nomeFicheiro, mimeType, tamanhoBytes }) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (!storagePath || !nomeFicheiro) return { ok: false, erro: 'Ficheiro inválido.' }

  const supabase = await createClient()
  const { error } = await supabase.from('reuniao_anexos').insert({
    reuniao_id: reuniaoId,
    storage_path: storagePath,
    nome_ficheiro: nomeFicheiro,
    mime_type: mimeType || null,
    tamanho_bytes: tamanhoBytes || null,
    criado_por: pessoa.id,
  })
  if (error) return { ok: false, erro: error.message }
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}

/** Remover anexo (BD + Storage) (super_admin). */
export async function removerAnexoReuniao(reuniaoId, anexoId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { data: anexo } = await supabase
    .from('reuniao_anexos')
    .select('storage_path')
    .eq('id', anexoId)
    .single()
  if (!anexo) return { ok: false, erro: 'Anexo não encontrado.' }

  const { error } = await supabase.from('reuniao_anexos').delete().eq('id', anexoId)
  if (error) return { ok: false, erro: error.message }

  await supabase.storage.from(BUCKET).remove([anexo.storage_path])
  revalidatePath(`/reunioes/${reuniaoId}`)
  return { ok: true }
}
