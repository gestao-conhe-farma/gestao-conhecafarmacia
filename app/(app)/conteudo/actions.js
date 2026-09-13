'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Conteúdos para redes sociais (calendário editorial).
 * Equipa inteira cria e edita — coordenação é quem apaga (RLS impõe).
 */

const PLATAFORMAS = ['facebook', 'instagram', 'tiktok', 'youtube']
const ESTADOS = ['ideia', 'planeado', 'produzido', 'agendado', 'publicado']

function validar({ titulo, plataforma, dataPublicacao, estado, linkPublicacao }) {
  if (!titulo?.trim()) return 'O tema é obrigatório.'
  if (!PLATAFORMAS.includes(plataforma)) return 'Plataforma inválida.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPublicacao ?? '')) return 'Indica a data de saída.'
  if (estado && !ESTADOS.includes(estado)) return 'Estado inválido.'
  // O link vira href numa âncora — só http(s). Bloqueia javascript:, data:,
  // vbscript: e afins (um link malicioso seria armazenado por qualquer membro
  // e executado no browser de quem clicasse).
  if (linkPublicacao?.trim()) {
    try {
      const u = new URL(linkPublicacao.trim())
      if (!['http:', 'https:'].includes(u.protocol)) {
        return 'O link da publicação tem de começar por http:// ou https://.'
      }
    } catch {
      return 'O link da publicação não é um URL válido.'
    }
  }
  return null
}

export async function criarConteudo(payload) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

  const erro = validar(payload)
  if (erro) return { ok: false, erro }

  const supabase = await createClient()
  const { error } = await supabase.from('conteudo_redes').insert({
    titulo: payload.titulo.trim(),
    descricao: payload.descricao?.trim() || null,
    plataforma: payload.plataforma,
    data_publicacao: payload.dataPublicacao,
    estado: payload.estado || 'ideia',
    link_publicacao: payload.linkPublicacao?.trim() || null,
    criado_por: pessoa.id,
  })
  if (error) {
    if (error.code === '23505') {
      return { ok: false, erro: 'Já existe um conteúdo com este tema nesta plataforma e dia.' }
    }
    return { ok: false, erro: error.message }
  }

  revalidatePath('/conteudo')
  revalidatePath('/')
  return { ok: true }
}

export async function atualizarConteudo(id, payload) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

  const erro = validar(payload)
  if (erro) return { ok: false, erro }

  const supabase = await createClient()
  const { error } = await supabase
    .from('conteudo_redes')
    .update({
      titulo: payload.titulo.trim(),
      descricao: payload.descricao?.trim() || null,
      plataforma: payload.plataforma,
      data_publicacao: payload.dataPublicacao,
      estado: payload.estado || 'ideia',
      link_publicacao: payload.linkPublicacao?.trim() || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    if (error.code === '23505') {
      return { ok: false, erro: 'Já existe um conteúdo com este tema nesta plataforma e dia.' }
    }
    return { ok: false, erro: error.message }
  }

  revalidatePath('/conteudo')
  revalidatePath('/')
  return { ok: true }
}

/** Marcar como publicado com o link (atalho frequente). */
export async function publicarConteudo(id, link) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

  const supabase = await createClient()
  const { error } = await supabase
    .from('conteudo_redes')
    .update({
      estado: 'publicado',
      link_publicacao: link?.trim() || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/conteudo')
  return { ok: true }
}

/** Desativar (soft delete) — mantém o histórico; apagar é da coordenação. */
export async function desativarConteudo(id, ativo) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual

  const supabase = await createClient()
  const { error } = await supabase
    .from('conteudo_redes')
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/conteudo')
  return { ok: true }
}

export async function eliminarConteudo(id) {
  const atual = await getUtilizadorAtual()
  if (!atual) return { ok: false, erro: 'Sessão inválida. Recarrega a página e tenta novamente.' }
  const { pessoa } = atual
  if (pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Só a coordenação pode apagar. Desativa o conteúdo em vez disso.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('conteudo_redes').delete().eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/conteudo')
  return { ok: true }
}
