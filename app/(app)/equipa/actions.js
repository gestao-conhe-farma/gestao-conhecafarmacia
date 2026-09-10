'use server'

import { createAdminClient, createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { normalizarNumero, validarNumeroE164 } from '@/lib/contactos'

/**
 * Criar conta de membro da equipa (só super_admin).
 * Usa a Admin API (service_role) + insert em pessoas.
 * Se já existir conta desativada com este email, é reativada
 * (mesma identidade, histórico preservado) em vez de falhar.
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
  const emailLimpo = email.trim().toLowerCase()

  // 1) Conta desativada com o mesmo email? → reativar
  const { data: lista } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existente = lista?.users?.find((u) => u.email?.toLowerCase() === emailLimpo)
  if (existente) {
    const { data: registo } = await admin
      .from('pessoas')
      .select('ativo')
      .eq('id', existente.id)
      .maybeSingle()

    if (registo && !registo.ativo) {
      const { error: erroDesban } = await admin.auth.admin.updateUserById(existente.id, {
        ban_duration: 'none',
        password,
      })
      if (erroDesban) return { ok: false, erro: erroDesban.message }

      const { error } = await admin
        .from('pessoas')
        .update({ nome: nome.trim(), role, ativo: true })
        .eq('id', existente.id)
      if (error) return { ok: false, erro: error.message }

      revalidatePath('/equipa')
      return { ok: true, reativada: true }
    }
    return { ok: false, erro: 'Já existe uma conta com este email.' }
  }

  // 2) Criar no Auth
  const { data, error } = await admin.auth.admin.createUser({
    email: emailLimpo,
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

  // 3) Registar em pessoas (fonte da verdade do role)
  const { error: erroPessoa } = await admin.from('pessoas').insert({
    id: data.user.id,
    nome: nome.trim(),
    email: emailLimpo,
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
        'Telefone inválido — usa o formato internacional: + código do país e 8–14 dígitos (ex.: +244923456789). Números locais sem o +código não funcionam em ligações nem no WhatsApp.',
    }
  }
  if (zap && !validarNumeroE164(zap)) {
    return {
      ok: false,
      erro:
        'WhatsApp inválido — usa o formato internacional: + código do país e 8–14 dígitos (ex.: +244923456789).',
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

/**
 * Remover um membro (só super_admin): desativação suave.
 * - A conta Auth é banida (sem login, sem apagar) e o registo em
 *   pessoas fica com ativo = false;
 * - O histórico (notas de reuniões, atividades, documentos, …)
 *   continua a resolver o nome via join;
 * - A pessoa sai da directoria, dos selectores e dos perfis.
 * Reativar = criar conta com o mesmo email (mesma identidade).
 */
export async function removerMembro(pessoaId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }
  if (pessoaId === pessoa.id) {
    return { ok: false, erro: 'Não podes remover a tua própria conta.' }
  }

  const admin = await createAdminClient()

  // 1) Banir a conta Auth (revoga sessões; mantém o utilizador)
  const { error: erroBan } = await admin.auth.admin.updateUserById(pessoaId, {
    ban_duration: '876000h', // ~100 anos
  })
  if (erroBan) return { ok: false, erro: erroBan.message }

  // 2) Marcar como inativo em pessoas
  const { error } = await admin
    .from('pessoas')
    .update({ ativo: false })
    .eq('id', pessoaId)
  if (error) {
    // Reverte o ban para não deixar conta bloqueada com registo ativo
    await admin.auth.admin.updateUserById(pessoaId, { ban_duration: 'none' })
    return { ok: false, erro: error.message }
  }

  revalidatePath('/equipa')
  revalidatePath(`/equipa/${pessoaId}`)
  return { ok: true }
}
