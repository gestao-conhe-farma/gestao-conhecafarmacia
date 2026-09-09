import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'

/**
 * Atividades de topo (atividade/evento/entrevista) com criador e responsáveis.
 * RLS garante a visibilidade correta; ordena por criação desc.
 */
export async function listarAtividades({ tipo } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('atividades')
    .select(
      `id, titulo, descricao, tipo, prazo, status_evento, criado_em, parent_id,
       criado_por:pessoas!atividades_criado_por_fkey(id, nome),
       atividade_responsaveis(pessoa_id, pessoas(id, nome))`
    )
    .order('criado_em', { ascending: false })

  if (tipo && tipo !== 'todas') {
    query = query.eq('tipo', tipo)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Atividades subordinadas a um evento (parent_id = evento).
 */
export async function listarAtividadesFilhas(eventoId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('atividades')
    .select(
      `id, titulo, tipo, prazo, criado_em,
       criado_por:pessoas!atividades_criado_por_fkey(id, nome),
       atividade_responsaveis(pessoa_id, pessoas(id, nome))`
    )
    .eq('parent_id', eventoId)
    .order('criado_em', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Subtarefas (com filtros opcionais) com criador, aprovador e responsáveis. */
export async function listarSubtarefas({ atividadeId, status } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('subtarefas')
    .select(
      `id, titulo, descricao, prazo, status, criado_em, aprovado_em, atividade_id,
       criado_por:pessoas!subtarefas_criado_por_fkey(id, nome),
       aprovado_por:pessoas!subtarefas_aprovado_por_fkey(id, nome),
       subtarefa_responsaveis(pessoa_id, pessoas(id, nome))`
    )
    .order('criado_em', { ascending: false })

  if (atividadeId) query = query.eq('atividade_id', atividadeId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

/** Atividade única por id. */
export async function obterAtividade(id) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('atividades')
    .select(
      `id, titulo, descricao, tipo, prazo, status_evento, criado_em, parent_id,
       criado_por:pessoas!atividades_criado_por_fkey(id, nome),
       atividade_responsaveis(pessoa_id, pessoas(id, nome))`
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/** Participantes de uma entrevista. */
export async function listarParticipantes(atividadeId) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('entrevista_participantes')
    .select('pessoa_id, status, pessoas(id, nome, email)')
    .eq('atividade_id', atividadeId)

  return data ?? []
}

// =============================================================
// Documentos
// =============================================================

/** Categorias de documentos ordenadas por nome. */
export async function listarCategoriasDocs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('doc_categorias')
    .select('id, nome')
    .order('nome')
  if (error) throw new Error(error.message)
  return data ?? []
}

/** Documentos (visíveis conforme RLS) com filtros opcionais. */
export async function listarDocumentos({ categoriaId, busca } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('documentos')
    .select(
      `id, titulo, descricao, codigo, nome_ficheiro, mime_type, tamanho_bytes, restrito, criado_em,
       categoria:doc_categorias(id, nome),
       criado_por:pessoas!documentos_criado_por_fkey(id, nome)`
    )
    .order('criado_em', { ascending: false })

  if (categoriaId) query = query.eq('categoria_id', categoriaId)
  if (busca) query = query.or(`titulo.ilike.%${busca}%,codigo.ilike.%${busca}%,descricao.ilike.%${busca}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

/** Equipa (super_admin apenas — RLS bloqueia os restantes). */
export async function listarEquipa() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pessoas')
    .select('id, nome, email, role, criado_em')
    .order('criado_em', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Utilizador atual + pessoa (atalho para páginas). */
export function utilizadorAtual() {
  return getUtilizadorAtual()
}

export function formatarData(valor) {
  if (!valor) return null
  return new Date(valor).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
