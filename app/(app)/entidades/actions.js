'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Entidades — parceiros, patrocinadores e instituições com que a
 * equipa colabora. Colaborativo como os profissionais: todos leem
 * e editam; delete definitivo só coordenação.
 */

const TIPOS = ['parceiro', 'patrocinador', 'instituicao', 'empresa']

function limparCampos(payload) {
  return {
    nome: (payload?.nome ?? '').trim(),
    tipo: TIPOS.includes(payload?.tipo) ? payload.tipo : 'parceiro',
    area: (payload?.area ?? '').trim() || null,
    contacto_nome: (payload?.contacto_nome ?? '').trim() || null,
    contacto_email: (payload?.contacto_email ?? '').trim() || null,
    contacto_telefone: (payload?.contacto_telefone ?? '').trim() || null,
    notas: (payload?.notas ?? '').trim() || null,
  }
}

/** Criar entidade. */
export async function criarEntidade(payload) {
  const { pessoa } = await getUtilizadorAtual()

  const campos = limparCampos(payload)
  if (!campos.nome) return { ok: false, erro: 'O nome é obrigatório.' }

  const supabase = await createClient()

  const { data: parecidas } = await supabase
    .from('entidades')
    .select('id, nome')
    .ilike('nome', campos.nome)
  if (parecidas?.length) {
    return {
      ok: false,
      duplicado: parecidas[0].nome,
      erro: `Já existe "${parecidas[0].nome}" — confirma antes de gravar.`,
    }
  }

  const { error } = await supabase
    .from('entidades')
    .insert({ ...campos, criado_por: pessoa.id })
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/entidades')
  return { ok: true }
}

/** Editar entidade (qualquer membro). */
export async function editarEntidade(id, payload) {
  await getUtilizadorAtual()

  const campos = limparCampos(payload)
  if (!campos.nome) return { ok: false, erro: 'O nome é obrigatório.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('entidades')
    .update({ ...campos, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/entidades')
  return { ok: true }
}

/** Marcar entidade como inativa/ativa (qualquer membro). */
export async function alternarAtivoEntidade(id, ativo) {
  await getUtilizadorAtual()

  const supabase = await createClient()
  const { error } = await supabase
    .from('entidades')
    .update({ ativo: Boolean(ativo), atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/entidades')
  return { ok: true }
}

/** Eliminar definitivamente (super_admin). */
export async function eliminarEntidade(id) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Só a coordenação pode eliminar — usa "Marcar inativa" para esconder da lista.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('entidades').delete().eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/entidades')
  return { ok: true }
}
