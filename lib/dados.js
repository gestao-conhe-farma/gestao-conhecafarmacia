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

/**
 * Datas para o calendário do dashboard: atividades/eventos/entrevistas e
 * subtarefas com prazo definido, mais reuniões agendadas. RLS garante a
 * visibilidade. Devolve arrays crus — o dashboard filtra e molda.
 */
export async function listarDatasFuturas() {
  const supabase = await createClient()

  const [ativas, subtarefas, reunioes] = await Promise.all([
    supabase
      .from('atividades')
      .select('id, titulo, tipo, prazo, status_evento')
      .not('prazo', 'is', null)
      .order('prazo', { ascending: true })
      .limit(200),
    supabase
      .from('subtarefas')
      .select('id, titulo, prazo, status, atividade_id')
      .not('prazo', 'is', null)
      .order('prazo', { ascending: true })
      .limit(200),
    supabase
      .from('reunioes')
      .select('id, titulo, tipo, data_hora, estado')
      .eq('estado', 'agendada')
      .order('data_hora', { ascending: true })
      .limit(100),
  ])

  // Falha silenciosa: o calendário é um extra — a página não deve rebentar
  // por causa dele.
  if (ativas.error) console.error('[dados] atividades p/ calendário:', ativas.error.message)
  if (subtarefas.error) console.error('[dados] subtarefas p/ calendário:', subtarefas.error.message)
  if (reunioes.error) console.error('[dados] reuniões p/ calendário:', reunioes.error.message)

  return {
    atividades: ativas.data ?? [],
    subtarefas: subtarefas.data ?? [],
    reunioes: reunioes.data ?? [],
  }
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

// =============================================================
// Reuniões
// =============================================================

/** Reuniões ordenadas por data (mais próximas/ recentes primeiro). */
export async function listarReunioes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reunioes')
    .select(
      `id, titulo, tipo, estado, data_hora, local, resumo_publicado_em, criado_em,
       criado_por:pessoas!reunioes_criado_por_fkey(id, nome),
       reuniao_participantes(pessoa_id, status, presenca)`
    )
    .order('data_hora', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Reunião única por id. */
export async function obterReuniao(id) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reunioes')
    .select(
      `id, titulo, tipo, estado, data_hora, local, pauta, resumo, resumo_publicado_em, criado_em,
       criado_por:pessoas!reunioes_criado_por_fkey(id, nome),
       reuniao_participantes(pessoa_id, status, presenca, pessoas(id, nome, email))`
    )
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/** Notas de uma reunião (thread cronológico). */
export async function listarNotasReuniao(reuniaoId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reuniao_notas')
    .select(
      `id, conteudo, criado_em, editado_em, autor_id,
       autor:pessoas!reuniao_notas_autor_id_fkey(id, nome)`
    )
    .eq('reuniao_id', reuniaoId)
    .order('criado_em', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Planos de uma reunião com votos agregados. */
export async function listarPlanosReuniao(reuniaoId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reuniao_planos')
    .select(
      `id, titulo, descricao, decisao, decidido_em, atividade_id, criado_em,
       criado_por:pessoas!reuniao_planos_criado_por_fkey(id, nome),
       reuniao_plano_votos(pessoa_id, voto)`
    )
    .eq('reuniao_id', reuniaoId)
    .order('criado_em', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Anexos de uma reunião. */
export async function listarAnexosReuniao(reuniaoId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reuniao_anexos')
    .select(
      `id, storage_path, nome_ficheiro, mime_type, tamanho_bytes, criado_em,
       criado_por:pessoas!reuniao_anexos_criado_por_fkey(id, nome)`
    )
    .eq('reuniao_id', reuniaoId)
    .order('criado_em', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Configuração da recorrência mensal (linha única). */
export async function obterConfiguracaoReunioes() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reuniao_configuracao')
    .select('ativa, semana_do_mes, dia_semana, dia_do_mes, hora, local')
    .eq('id', 1)
    .single()
  return data
}

/**
 * Equipa ativa (directoria, convocados, responsáveis): só membros com
 * sessão possível. Desativados ficam de fora — o histórico deles
 * continua a resolver o nome pelos joins (linhas continuam legíveis).
 */
export async function listarEquipa() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pessoas')
    .select('id, nome, email, role, telefone, whatsapp, ativo, criado_em')
    .eq('ativo', true)
    .order('criado_em', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Equipa completa incluindo desativados — gestão da coordenação.
 * (Reservado para futura lista de ex-membros; a directoria usa listarEquipa.)
 */
export async function listarEquipaCompleta() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pessoas')
    .select('id, nome, email, role, telefone, whatsapp, ativo, criado_em')
    .order('criado_em', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Pessoa da equipa por id (perfil). Inclui desativados: o histórico
 * (notas, atividades) liga a estes perfis — "ex-membro" em vez de 404.
 * null se não existir.
 */
export async function obterPessoa(id) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pessoas')
    .select('id, nome, email, role, telefone, whatsapp, ativo, criado_em')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * Carga de trabalho de um membro: atividades/eventos/entrevistas de topo
 * em que é responsável + subtarefas atribuídas a ele.
 */
export async function listarCargaMembro(pessoaId) {
  const supabase = await createClient()
  const [ativas, subtarefas] = await Promise.all([
    supabase
      .from('atividades')
      .select(
        `id, titulo, tipo, prazo, status_evento,
         atividade_responsaveis!inner(pessoa_id)`
      )
      .eq('atividade_responsaveis.pessoa_id', pessoaId)
      .order('prazo', { ascending: true, nullsFirst: false })
      .limit(50),
    supabase
      .from('subtarefas')
      .select(
        `id, titulo, prazo, status, atividade_id,
         subtarefa_responsaveis!inner(pessoa_id)`
      )
      .eq('subtarefa_responsaveis.pessoa_id', pessoaId)
      .order('prazo', { ascending: true, nullsFirst: false })
      .limit(50),
  ])

  // Falha silenciosa: a carga é um extra do perfil, não o essencial
  if (ativas.error) console.error('[dados] atividades do membro:', ativas.error.message)
  if (subtarefas.error) console.error('[dados] subtarefas do membro:', subtarefas.error.message)

  return {
    atividades: ativas.data ?? [],
    subtarefas: subtarefas.data ?? [],
  }
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
