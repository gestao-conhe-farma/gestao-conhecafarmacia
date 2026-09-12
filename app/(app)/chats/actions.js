'use server'

import { notificar, semAutor } from '@/lib/notificacoes'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canalDM, marcarCanalLido } from '@/lib/dados'

/**
 * Ações do chat — mensagens contextuais (atividade/reunião) e DMs
 * entre membros. Sem chat geral, por decisão.
 *
 * A visibilidade é imposta pelas policies RLS da migração 0021
 * (helper pode_ver_canal); as validações aqui dão mensagens de erro
 * claras em vez de erros cruas do PostgREST.
 */

const CANAL_RE = /^(atividade|reuniao):[0-9a-f-]{36}$/

/** Valida o formato do canal e (para DMs) que o atual é participante. */
async function validarCanal(supabase, canal, meuId) {
  if (CANAL_RE.test(canal)) {
    const [prefixo, id] = canal.split(':')
    // O objeto pai tem de existir — e, para reuniões privadas, o RLS
    // do select já devolve null a quem não pode ver (404 implícito).
    const tabela = prefixo === 'atividade' ? 'atividades' : 'reunioes'
    const { data } = await supabase.from(tabela).select('id').eq('id', id).maybeSingle()
    if (!data) return 'Canal não encontrado ou sem acesso.'
    return null
  }

  if (canal.startsWith('dm:')) {
    const [, a, b] = canal.split(':')
    if (a === b || !a || !b) return 'Canal de mensagem inválido.'
    if (meuId !== a && meuId !== b) return 'Não és participante desta conversa.'
    return null
  }

  return 'Canal inválido.'
}

function textoValido(texto) {
  const t = (texto ?? '').trim()
  if (!t) return null
  return t.slice(0, 4000)
}

/**
 * Avisa quem pertence ao canal da nova mensagem — in-app, sem email
 * (chat é fluxo de trabalho, não urgência; o email fica para convites
 * e atas). DMs avisam o parceiro; atividades avisam os responsáveis;
 * reuniões avisam os participantes (a 0020 impede convocatórias a
 * não-coordenadores em reuniões privadas, por isso quem está na lista
 * consegue ver a reunião e o canal).
 */
async function avisarCanal(supabase, canal, autorId, nomeAutor, texto) {
  try {
    const [prefixo, id] = canal.split(':')
    let destinatarios = []
    let link = null
    let contexto = ''

    if (prefixo === 'dm') {
      const [, a, b] = canal.split(':')
      destinatarios = [a === autorId ? b : a]
      // O link tem de apontar para o AUTOR (o destinatário abre a
      // conversa com quem lhe escreveu) — apontar para o próprio
      // destinatário caía na página "Conversa inválida".
      link = `/conversas/${autorId}`
    } else {
      const tabela = prefixo === 'atividade' ? 'atividade_responsaveis' : 'reuniao_participantes'
      const coluna = prefixo === 'atividade' ? 'atividade_id' : 'reuniao_id'
      const { data } = await supabase
        .from(tabela)
        .select('pessoa_id')
        .eq(coluna, id)
      destinatarios = (data ?? []).map((r) => r.pessoa_id)
      link = prefixo === 'atividade' ? `/atividades/${id}` : `/reunioes/${id}`
      contexto = prefixo === 'atividade' ? 'na atividade' : 'na reunião'
    }

    await notificar(semAutor(destinatarios, autorId), {
      tipo: 'mensagem_nova',
      titulo: `Mensagem de ${nomeAutor} ${contexto}`.trim(),
      corpo: texto.slice(0, 120),
      link,
      soInApp: true,
    })
  } catch (e) {
    // Best-effort: a mensagem já foi guardada
    console.error('[chats] aviso do canal falhou', e?.message)
  }
}

/** Enviar mensagem num canal (atividade:<id>, reuniao:<id> ou dm:<a>:<b>). */
export async function enviarMensagem(canal, conteudo) {
  const { pessoa } = await getUtilizadorAtual()
  const texto = textoValido(conteudo)
  if (!texto) return { ok: false, erro: 'A mensagem está vazia.' }

  const supabase = await createClient()
  const erro = await validarCanal(supabase, canal, pessoa.id)
  if (erro) return { ok: false, erro }

  const { data: msg, error } = await supabase
    .from('mensagens')
    .insert({ canal, autor_id: pessoa.id, conteudo: texto })
    .select('id')
    .single()
  if (error) return { ok: false, erro: error.message }

  // Quem escreve, leu — o próprio recibo sobe, para o badge não
  // contar a própria mensagem.
  await supabase
    .from('mensagens_lidas')
    .upsert({ canal, pessoa_id: pessoa.id, lido_em: new Date().toISOString() })

  // Aviso in-app a quem pertence ao canal (excluindo o autor)
  await avisarCanal(supabase, canal, pessoa.id, pessoa.nome, texto)

  return { ok: true, id: msg.id }
}

/** Editar a própria mensagem (enquanto não apagada). */
export async function editarMensagem(mensagemId, conteudo) {
  const { pessoa } = await getUtilizadorAtual()
  const texto = textoValido(conteudo)
  if (!texto) return { ok: false, erro: 'A mensagem está vazia.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('mensagens')
    .update({ conteudo: texto, editado_em: new Date().toISOString() })
    .eq('id', mensagemId)
    .eq('autor_id', pessoa.id)

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

/** Apagar a própria mensagem (soft delete — a thread fica coerente). */
export async function apagarMensagem(mensagemId) {
  const { pessoa } = await getUtilizadorAtual()

  const supabase = await createClient()
  const { error } = await supabase
    .from('mensagens')
    .update({ apagada_em: new Date().toISOString(), conteudo: '' })
    .eq('id', mensagemId)
    .eq('autor_id', pessoa.id)

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

/**
 * Abrir (ou obter) a conversa com um membro e navegar para ela.
 * Não cria nada na BD — o canal dm:<a>:<b> existe implicitamente;
 * as linhas de mensagens nascem à primeira mensagem.
 */
export async function abrirConversaCom(idPessoa) {
  const { pessoa } = await getUtilizadorAtual()
  if (!idPessoa || idPessoa === pessoa.id) {
    return { ok: false, erro: 'Conversa inválida.' }
  }

  const supabase = await createClient()
  const { data: alvo } = await supabase
    .from('pessoas')
    .select('id, ativo')
    .eq('id', idPessoa)
    .maybeSingle()
  if (!alvo) return { ok: false, erro: 'Membro não encontrado.' }
  if (!alvo.ativo) return { ok: false, erro: 'Este membro está desativado.' }

  return { ok: true, canal: canalDM(pessoa.id, idPessoa) }
}

/**
 * Marcar o canal como lido (recibo do próprio, migração 0022).
 * Chamado ao abrir a página do canal e, em tempo real, quando chegam
 * novas mensagens com o painel aberto.
 */
export async function marcarLido(canal) {
  try {
    await marcarCanalLido(canal)
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: e?.message ?? 'Falha ao marcar como lido.' }
  }
}
