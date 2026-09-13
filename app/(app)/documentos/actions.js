'use server'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { BUCKET, MIME_ACEITES, EXT_PROIBIDAS, TAMANHO_MAX_BYTES } from '@/lib/documentos'
import { registarEvento } from '@/lib/auditoria'

/**
 * Regista os metadados do documento depois do upload do ficheiro
 * (o ficheiro é enviado direto do browser para o Storage).
 */
export async function registarDocumento(payload) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Apenas a coordenação pode adicionar documentos.' }
  }

  const supabase = await createClient()

  const { titulo, descricao, categoriaId, codigo, storagePath, nomeFicheiro, mimeType, tamanhoBytes, restrito } = payload
  if (!titulo?.trim() || !storagePath || !nomeFicheiro) {
    return { ok: false, erro: 'Título e ficheiro são obrigatórios.' }
  }

  // Validação SERVER-SIDE do ficheiro: mimeType/tamanho vinham do browser
  // e podiam mentir. Extensões executáveis/ativas (html, svg, js) são
  // proibidas — quem precisa de partilhar HTML exporta para PDF.
  const ext = '.' + (nomeFicheiro.split('.').pop() || '').toLowerCase()
  if (EXT_PROIBIDAS.includes(ext)) {
    return { ok: false, erro: `Ficheiros ${ext} não são permitidos — exporta para PDF.` }
  }
  if (mimeType && !MIME_ACEITES.includes(mimeType)) {
    return { ok: false, erro: 'Tipo de ficheiro não suportado.' }
  }
  if (tamanhoBytes && Number(tamanhoBytes) > TAMANHO_MAX_BYTES) {
    return { ok: false, erro: `Ficheiro demasiado grande (máx. ${TAMANHO_MAX_BYTES / (1024 * 1024)} MB).` }
  }

  // O ficheiro tem de existir no bucket sob o path indicado — impede
  // registos fantasma que apontem para paths de outros documentos.
  const pasta = storagePath.split('/').slice(0, -1).join('/')
  const nomeNoBucket = storagePath.split('/').pop()
  const { data: objetos, error: erroObjeto } = await supabase.storage
    .from(BUCKET)
    .list(pasta, { search: nomeNoBucket, limit: 100 })
  const ficheiroExiste = objetos?.some((o) => o.name === nomeNoBucket)
  if (erroObjeto || !ficheiroExiste) {
    return { ok: false, erro: 'Ficheiro não encontrado no armazenamento — volta a carregá-lo.' }
  }

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

  await registarEvento('documento.criado', { documento_id: data.id, titulo: titulo.trim() }, pessoa.id)

  revalidatePath('/documentos')
  return { ok: true, id: data.id }
}

/**
 * Atualiza os metadados de um documento (coordenação apenas).
 * O ficheiro em si não muda — só título, descrição, código,
 * categoria e a marca de restrito.
 */
export async function editarDocumento(documentoId, payload) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') {
    return { ok: false, erro: 'Sem permissão.' }
  }

  const { titulo, descricao, categoriaId, codigo, restrito } = payload ?? {}
  if (!titulo?.trim()) return { ok: false, erro: 'O título é obrigatório.' }

  const supabase = await createClient()

  // Categoria tem de existir — impede apontar para um id inexistente.
  if (categoriaId) {
    const { data: cat } = await supabase
      .from('doc_categorias')
      .select('id')
      .eq('id', categoriaId)
      .single()
    if (!cat) return { ok: false, erro: 'Categoria não encontrada.' }
  }

  const { error } = await supabase
    .from('documentos')
    .update({
      titulo: titulo.trim(),
      descricao: descricao?.trim() || null,
      categoria_id: categoriaId || null,
      codigo: codigo?.trim() || null,
      restrito: Boolean(restrito),
    })
    .eq('id', documentoId)

  if (error) return { ok: false, erro: error.message }

  await registarEvento('documento.editado', { documento_id: documentoId, titulo: titulo.trim() }, pessoa.id)

  revalidatePath('/documentos')
  return { ok: true }
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
    .select('storage_path, titulo')
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

  await registarEvento('documento.eliminado', { documento_id: documentoId, titulo: doc.titulo }, pessoa.id)

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
