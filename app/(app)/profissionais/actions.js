'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Profissionais externos — roster colaborativo para convites a
 * entrevistas. Qualquer membro lê, cria e edita; eliminação
 * definitiva é só da coordenação (membros usam ativo=false).
 */

function limparCampos(payload) {
  return {
    nome: (payload?.nome ?? '').trim(),
    profissao: (payload?.profissao ?? '').trim() || null,
    instituicao: (payload?.instituicao ?? '').trim() || null,
    telefone: (payload?.telefone ?? '').trim() || null,
    email: (payload?.email ?? '').trim() || null,
    temas: (payload?.temas ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10),
    meios: (payload?.meios ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10),
    disponibilidade: (payload?.disponibilidade ?? '').trim() || null,
    notas: (payload?.notas ?? '').trim() || null,
  }
}

/** Criar profissional. */
export async function criarProfissional(payload) {
  const { pessoa } = await getUtilizadorAtual()

  const campos = limparCampos(payload)
  if (!campos.nome) return { ok: false, erro: 'O nome é obrigatório.' }
  if (!campos.telefone && !campos.email) {
    return { ok: false, erro: 'Indica pelo menos um contacto: telefone ou email.' }
  }

  const supabase = await createClient()

  // Deduplicação leve: avisa se já existe nome muito parecido
  const { data: parecidos } = await supabase
    .from('profissionais')
    .select('id, nome')
    .ilike('nome', campos.nome)
  if (parecidos?.length) {
    return {
      ok: false,
      duplicado: parecidos[0].nome,
      erro: `Já existe "${parecidos[0].nome}" na lista — confirma antes de gravar.`,
    }
  }

  const { error } = await supabase
    .from('profissionais')
    .insert({ ...campos, criado_por: pessoa.id })
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/profissionais')
  return { ok: true }
}

/** Editar profissional (qualquer membro). */
export async function editarProfissional(id, payload) {
  await getUtilizadorAtual()

  const campos = limparCampos(payload)
  if (!campos.nome) return { ok: false, erro: 'O nome é obrigatório.' }
  if (!campos.telefone && !campos.email) {
    return { ok: false, erro: 'Indica pelo menos um contacto: telefone ou email.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profissionais')
    .update({ ...campos, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/profissionais')
  return { ok: true }
}

/** Marcar como inativo/ativo (qualquer membro) — não apaga histórico. */
export async function alternarAtivoProfissional(id, ativo) {
  await getUtilizadorAtual()

  const supabase = await createClient()
  const { error } = await supabase
    .from('profissionais')
    .update({ ativo: Boolean(ativo), atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/profissionais')
  return { ok: true }
}

/** Eliminar definitivamente (super_admin). */
export async function eliminarProfissional(id) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Só a coordenação pode eliminar — usa "Marcar indisponível" para esconder da lista.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profissionais').delete().eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/profissionais')
  return { ok: true }
}
