'use server'

import { createClient, createAdminClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Altera a palavra-passe do utilizador autenticado.
 * 1. Verifica a palavra-passe atual com um cliente anónimo isolado
 *    (sem tocar nos cookies de sessão).
 * 2. Atualiza com o cliente da sessão (auth.updateUser).
 * A nova palavra-passe invalida as sessões noutros dispositivos.
 */
export async function alterarPalavraPasse({ atual, nova }) {
  const { user } = await getUtilizadorAtual()

  if (!atual || !nova) {
    return { ok: false, erro: 'Preenche a palavra-passe atual e a nova.' }
  }
  if (nova.length < 8) {
    return { ok: false, erro: 'A nova palavra-passe deve ter pelo menos 8 caracteres.' }
  }
  if (atual === nova) {
    return { ok: false, erro: 'A nova palavra-passe deve ser diferente da atual.' }
  }

  // 1) Confirmar a palavra-passe atual (cliente isolado, sem cookies)
  const verificador = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { error: erroVerificacao } = await verificador.auth.signInWithPassword({
    email: user.email,
    password: atual,
  })

  if (erroVerificacao) {
    return { ok: false, erro: 'A palavra-passe atual está incorreta.' }
  }

  // 2) Atualizar (sessão atual; as outras são revogadas pela Supabase)
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: nova })

  if (error) {
    console.error('[definicoes] updateUser falhou', JSON.stringify({
      code: error.code,
      message: error.message,
    }))
    return { ok: false, erro: 'Não foi possível atualizar: ' + error.message }
  }

  return { ok: true }
}

/**
 * Atualiza o nome próprio do utilizador (apenas o próprio registo).
 * O email fica fixo — a alteração de email exigiria fluxo de verificação.
 */
export async function atualizarNome(nome) {
  const { pessoa } = await getUtilizadorAtual()

  const nomeLimpo = (nome ?? '').trim()
  if (nomeLimpo.length < 2) {
    return { ok: false, erro: 'O nome deve ter pelo menos 2 caracteres.' }
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('pessoas')
    .update({ nome: nomeLimpo })
    .eq('id', pessoa.id)

  if (error) return { ok: false, erro: error.message }

  revalidatePath('/definicoes')
  revalidatePath('/')
  return { ok: true }
}

/**
 * Termina a sessão em TODOS os dispositivos (scope global).
 */
export async function terminarTodasSessoes() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
  return { ok: true }
}
