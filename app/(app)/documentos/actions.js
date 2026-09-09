'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { BUCKET } from '@/lib/documentos'

/**
 * Regista os metadados do documento depois do upload do ficheiro
 * (o ficheiro é enviado direto do browser para o Storage).
 */
export async function registarDocumento(payload) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Apenas a coordenação pode adicionar documentos.' }
  }

  const { titulo, descricao, categoriaId, codigo, storagePath, nomeFicheiro, mimeType, tamanhoBytes, restrito } = payload
  if (!titulo?.trim() || !storagePath || !nomeFicheiro) {
    return { ok: false, erro: 'Título e ficheiro são obrigatórios.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documentos')
    .insert({
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      categoria_id: categoriaId || null,
      codigo: codigo?.trim() || null,
      storage_path: storagePath,
      nome_ficheiro: nomeFicheiro,
      mime_type: mimeType || null,
      tamanho_bytes: tamanhoBytes || null,
      restrito: Boolean(restrito),
      criado_por: pessoa.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, erro: error.message }

  revalidatePath('/documentos')
  return { ok: true, id: data.id }
}

/**
 * Elimina o documento (BD + ficheiro no Storage). Coordenação apenas.
 */
export async function eliminarDocumento(documentoId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documentos')
    .select('storage_path')
    .eq('id', documentoId)
    .single()

  if (!doc) return { ok: false, erro: 'Documento não encontrado.' }

  const { error } = await supabase.from('documentos').delete().eq('id', documentoId)
  if (error) return { ok: false, erro: error.message }

  // Ficheiro no storage (best-effort; falha não impede o registo)
  const { error: erroStorage } = await supabase.storage.from(BUCKET).remove([doc.storage_path])
  if (erroStorage) {
    console.error('[documentos] falha ao remover ficheiro', doc.storage_path, erroStorage.message)
  }

  revalidatePath('/documentos')
  return { ok: true }
}

/** Criar categoria (coordenação). */
export async function criarCategoria(nome) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const nomeLimpo = (nome ?? '').trim()
  if (nomeLimpo.length < 2) return { ok: false, erro: 'Nome demasiado curto.' }

  const supabase = await createClient()
  const { error } = await supabase.from('doc_categorias').insert({ nome: nomeLimpo })
  if (error) {
    if (error.code === '23505') return { ok: false, erro: 'Já existe uma categoria com esse nome.' }
    return { ok: false, erro: error.message }
  }

  revalidatePath('/documentos')
  return { ok: true }
}

/** Renomear categoria (coordenação). */
export async function renomearCategoria(id, nome) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const nomeLimpo = (nome ?? '').trim()
  if (nomeLimpo.length < 2) return { ok: false, erro: 'Nome demasiado curto.' }

  const supabase = await createClient()
  const { error } = await supabase.from('doc_categorias').update({ nome: nomeLimpo }).eq('id', id)
  if (error) {
    if (error.code === '23505') return { ok: false, erro: 'Já existe uma categoria com esse nome.' }
    return { ok: false, erro: error.message }
  }

  revalidatePath('/documentos')
  return { ok: true }
}

/**
 * Eliminar categoria. Só permite se não tiver documentos associados
 * (evita órfãos); o utilizador deve mover/eliminar os docs primeiro.
 */
export async function eliminarCategoria(id) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()

  const { count } = await supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id)

  if (count > 0) {
    return {
      ok: false,
      erro: `Esta categoria tem ${count} documento(s). Move-os ou elimina-os primeiro.`,
    }
  }

  const { error } = await supabase.from('doc_categorias').delete().eq('id', id)
  if (error) return { ok: false, erro: error.message }

  revalidatePath('/documentos')
  return { ok: true }
}
