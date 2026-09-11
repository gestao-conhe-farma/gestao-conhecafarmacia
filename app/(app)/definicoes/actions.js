'use server'

import { createClient, createAdminClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { registarEvento } from '@/lib/auditoria'

// =============================================================
// 2FA / TOTP — Activar, confirmar e desativar a segunda camada.
// Usa o MFA TOTP nativo do Supabase Auth (supabase.auth.mfa.*).
// =============================================================

/**
 * Começa a ativação do 2FA: cria um fator TOTP pendente e devolve
 * o segredo + URI otpauth para gerar o QR no cliente.
 */
export async function iniciarAtivacao2FA() {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) return { ok: false, erro: 'Sessão inválida.' }

  const supabase = await createClient()

  // Limpa fatores pendentes esquecidos (unverified) para não acumular lixo
  const { data: fatores } = await supabase.auth.mfa.listFactors()
  if (fatores) {
    for (const f of fatores.totp ?? []) {
      if (f.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `${pessoa.nome} · ${new Date().toLocaleDateString('pt-PT')}`,
  })

  if (error) return { ok: false, erro: 'Não foi possível iniciar: ' + error.message }

  return {
    ok: true,
    factorId: data.id,
    qr: data.totp.qr_code, // data URL PNG, pronta a usar em <img>
    segredo: data.totp.secret,
  }
}

/**
 * Confirma a ativação com o código de 6 dígitos da app autenticadora.
 * Prova que a app realmente gere o segredo antes de ativar.
 */
export async function confirmarAtivacao2FA(factorId, codigo) {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) return { ok: false, erro: 'Sessão inválida.' }
  if (!/^[0-9]{6}$/.test((codigo ?? '').trim())) {
    return { ok: false, erro: 'Código inválido — são 6 dígitos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: codigo.trim(),
  })

  if (error) {
    return { ok: false, erro: 'Código incorreto ou expirado — espera um novo código e tenta outra vez.' }
  }

  await registarEvento('2fa.ativado', { pessoa_id: pessoa.id }, pessoa.id)
  revalidatePath('/definicoes')
  return { ok: true }
}

/**
 * Desativa o 2FA. Exige o código atual da app — não é um simples
 * botão que qualquer pessoa com a sessão aberta carregue.
 */
export async function desativar2FA(factorId, codigo) {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) return { ok: false, erro: 'Sessão inválida.' }
  if (!/^[0-9]{6}$/.test((codigo ?? '').trim())) {
    return { ok: false, erro: 'Código inválido — são 6 dígitos.' }
  }

  const supabase = await createClient()

  // Prova de posse: o código atual tem de validar antes do unenroll
  const { error: erroVerificacao } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: codigo.trim(),
  })
  if (erroVerificacao) {
    return { ok: false, erro: 'Código incorreto — o 2FA mantém-se ativo.' }
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) return { ok: false, erro: 'Não foi possível desativar: ' + error.message }

  await registarEvento('2fa.desativado', { pessoa_id: pessoa.id }, pessoa.id)
  revalidatePath('/definicoes')
  return { ok: true }
}

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
