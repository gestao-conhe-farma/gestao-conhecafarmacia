'use server'

import { notificar } from '@/lib/notificacoes'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canalDM } from '@/lib/dados'

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

  // DM: avisar o parceiro da primeira mensagem da conversa (in-app,
  // sem email — o chat é de trabalho, não urgência).
  if (canal.startsWith('dm:')) {
    const { count } = await supabase
      .from('mensagens')
      .select('id', { count: 'exact', head: true })
      .eq('canal', canal)
    if (count === 1) {
      const [, a, b] = canal.split(':')
      const parceiro = a === pessoa.id ? b : a
      notificar([parceiro], {
        tipo: 'dm_nova',
        titulo: `Nova conversa de ${pessoa.nome}`,
        corpo: texto.slice(0, 120),
        link: `/conversas/${parceiro}`,
      })
    }
  }

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
