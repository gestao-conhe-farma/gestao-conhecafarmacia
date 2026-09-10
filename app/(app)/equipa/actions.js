'use server'

import { createAdminClient, createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { normalizarNumero, validarNumeroE164 } from '@/lib/contactos'

/**
 * Criar conta de membro da equipa (só super_admin).
 * Usa a Admin API (service_role) + insert em pessoas.
 */
export async function criarConta({ nome, email, password, role }) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  if (!nome?.trim() || !email?.trim() || !password || password.length < 8) {
    return { ok: false, erro: 'Preenche todos os campos (palavra-passe: min. 8 caracteres).' }
  }
  if (!['admin', 'super_admin'].includes(role)) {
    return { ok: false, erro: 'Papel inválido.' }
  }

  const admin = await createAdminClient()

  // 1) Criar no Auth
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { nome: nome.trim() },
  })

  if (error) {
    if (error.code === 'email_exists') {
      return { ok: false, erro: 'Já existe uma conta com este email.' }
    }
    return { ok: false, erro: error.message }
  }

  // 2) Registar em pessoas (fonte da verdade do role)
  const { error: erroPessoa } = await admin.from('pessoas').insert({
    id: data.user.id,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    role,
  })

  if (erroPessoa) {
    await admin.auth.admin.deleteUser(data.user.id)
    return { ok: false, erro: 'Falha ao registar: ' + erroPessoa.message }
  }

  revalidatePath('/equipa')
  return { ok: true }
}

/** Alterar o papel de um membro (só super_admin; via service_role). */
export async function alterarRole(pessoaId, novoRole) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (!['admin', 'super_admin'].includes(novoRole)) return { ok: false, erro: 'Papel inválido.' }
  if (pessoaId === pessoa.id) {
    return { ok: false, erro: 'Não podes alterar o teu próprio papel.' }
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('pessoas').update({ role: novoRole }).eq('id', pessoaId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/equipa')
  return { ok: true }
}

/**
 * Atualiza os contactos (telefone / WhatsApp) do próprio membro.
 * Normaliza para E.164 (+ código do país, 8–14 dígitos) — o mesmo
 * formato validado na base. Números locais sem código do país são
 * rejeitados: sem o código, tanto as chamadas como o wa.me falham.
 */
export async function atualizarContactos({ telefone, whatsapp }) {
  const { pessoa } = await getUtilizadorAtual()

  const tel = normalizarNumero(telefone)
  const zap = normalizarNumero(whatsapp)

  if (tel && !validarNumeroE164(tel)) {
    return {
      ok: false,
      erro:
        'Telefone inválido — usa o formato internacional: + código do país e 8–14 dígitos (ex.: +258841234567). Números locais sem o +código não funcionam em ligações nem no WhatsApp.',
    }
  }
  if (zap && !validarNumeroE164(zap)) {
    return {
      ok: false,
      erro:
        'WhatsApp inválido — usa o formato internacional: + código do país e 8–14 dígitos (ex.: +258841234567).',
    }
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('pessoas')
    .update({ telefone: tel, whatsapp: zap })
    .eq('id', pessoa.id)

  if (error) return { ok: false, erro: error.message }

  revalidatePath('/equipa')
  revalidatePath(`/equipa/${pessoa.id}`)
  return { ok: true }
}

/** Remover acesso de um membro (apaga Auth + registo pessoas). */
export async function removerMembro(pessoaId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (pessoaId === pessoa.id) {
    return { ok: false, erro: 'Não podes remover a tua própria conta.' }
  }

  const admin = await createAdminClient()

  const { error: erroAuth } = await admin.auth.admin.deleteUser(pessoaId)
  if (erroAuth) return { ok: false, erro: erroAuth.message }

  // RLS não se aplica ao service_role; apaga registo em pessoas
  const { error } = await admin.from('pessoas').delete().eq('id', pessoaId)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/equipa')
  return { ok: true }
}
