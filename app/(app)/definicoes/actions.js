'use server'

import { createClient, createAdminClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { registarEvento } from '@/lib/auditoria'

// =============================================================
// Passkeys / biometria — gestão dos dispositivos registados.
// O registo (cerimónia WebAuthn) corre no browser; aqui ficam as
// ações de gestão que precisam de sessão no servidor.
// =============================================================

/** Mensagens amigáveis para os erros WebAuthn mais comuns. */
function erroPasskey(error) {
  const codigo = error?.code ?? error?.name ?? ''
  if (codigo === 'webauthn_credential_exists')
    return 'Este dispositivo já está registado nesta conta.'
  if (codigo === 'NotAllowedError')
    return 'Pedido de biometria cancelado ou expirado — tenta outra vez.'
  if (codigo === 'InvalidStateError')
    return 'Este dispositivo já tem um registo em curso — recarrega a página.'
  if (codigo === 'SecurityError')
    return 'O domínio atual não corresponde ao registo de biometria do projeto.'
  return 'Não foi possível completar a operação de biometria. Tenta novamente.'
}

/**
 * Renomeia um dispositivo/passkey da própria conta.
 */
export async function renomearPasskey(passkeyId, nome) {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) return { ok: false, erro: 'Sessão inválida.' }
  if (!passkeyId) return { ok: false, erro: 'Dispositivo não identificado.' }

  const nomeLimpo = (nome ?? '').trim().slice(0, 120)
  if (!nomeLimpo) return { ok: false, erro: 'O nome não pode ficar vazio.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.passkey.update({
    passkeyId,
    friendlyName: nomeLimpo,
  })
  if (error) {
    console.error('[definicoes] renomearPasskey', error.code ?? error.name, error.message)
    return { ok: false, erro: erroPasskey(error) }
  }

  await registarEvento('passkey.renomeada', { passkey_id: passkeyId }, pessoa.id)
  revalidatePath('/definicoes')
  return { ok: true }
}

/**
 * Elimina (revoga) um dispositivo/passkey da própria conta.
 * Depois disto, ele deixa de conseguir iniciar sessão por biometria.
 */
export async function eliminarPasskey(passkeyId) {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) return { ok: false, erro: 'Sessão inválida.' }
  if (!passkeyId) return { ok: false, erro: 'Dispositivo não identificado.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.passkey.delete({ passkeyId })
  if (error) {
    console.error('[definicoes] eliminarPasskey', error.code ?? error.name, error.message)
    return { ok: false, erro: erroPasskey(error) }
  }

  await registarEvento('passkey.eliminada', { passkey_id: passkeyId }, pessoa.id)
  revalidatePath('/definicoes')
  return { ok: true }
}

/**
 * Trilha de auditoria do registo — a cerimónia decorre no browser
 * (registerPasskey), o evento é registado aqui via service_role.
 */
export async function registarEventoPasskey(passkeyId) {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa || !passkeyId) return { ok: false }
  await registarEvento('passkey.registada', { passkey_id: passkeyId }, pessoa.id)
  return { ok: true }
}

/**
 * Começa a ativação do 2FA: cria um fator TOTP pendente e devolve
 * o segredo + URI otpauth para gerar o QR no cliente.
 */
// =============================================================
// 2FA / TOTP — Activar, confirmar e desativar a segunda camada.
// Usa o MFA TOTP nativo do Supabase Auth (supabase.auth.mfa.*).
// =============================================================

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
