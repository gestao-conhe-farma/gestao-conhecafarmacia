import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'

/**
 * Data (só o dia) já passou? Fim-do-dia local: o próprio dia ainda
 * conta como "a acontecer" — uma atividade de hoje só é passada à
 * meia-noite. Aceita Date, string ISO com hora, ou 'YYYY-MM-DD'.
 */
export function atividadeJaPassou(prazo) {
  if (!prazo) return false
  const d = new Date(prazo)
  if (Number.isNaN(d.getTime())) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(prazo).trim())) {
    // Date-only: a data de hoje NÃO é passada
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    return d < hoje
  }
  const fim = new Date(d)
  fim.setHours(23, 59, 59, 999)
  return fim < new Date()
}

/**
 * Ordena atividades pelo prazo (mais próximo primeiro), sem prazo no fim.
 * Empates mantêm a ordem de criação (sort estável).
 */
export function ordenarPorPrazo(atividades) {
  return [...(atividades ?? [])].sort((a, b) => {
    if (!a.prazo && !b.prazo) return 0
    if (!a.prazo) return 1
    if (!b.prazo) return -1
    return new Date(a.prazo) - new Date(b.prazo)
  })
}

/**
 * Atividades de topo (atividade/evento/entrevista) com criador e responsáveis.
 * RLS garante a visibilidade correta; ordena por criação desc.
 */
export async function listarAtividades({ tipo } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('atividades')
    .select(
      `id, titulo, descricao, tipo, prazo, status_evento, criado_em, parent_id, local,
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
       criado_por_id:criado_por,
       motivo_recusa:subtarefa_recusas(motivo),
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
 * Subtarefa única com responsáveis, motivo de recusa, motivos de estado
 * (caixa de relatório) e a desconfirmação de atribuição do próprio.
 */
export async function obterSubtarefa(id) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subtarefas')
    .select(
      `id, titulo, descricao, prazo, status, criado_em, aprovado_em, atividade_id,
       criado_por_id:criado_por,
       motivo_recusa:subtarefa_recusas(motivo),
       criado_por:pessoas!subtarefas_criado_por_fkey(id, nome),
       aprovado_por:pessoas!subtarefas_aprovado_por_fkey(id, nome),
       subtarefa_responsaveis(pessoa_id, pessoas(id, nome)),
       subtarefa_estado_motivos(id, pessoa_id, estado_novo, motivo, criado_em, pessoas(nome)),
       minhas_desconfirmacoes:subtarefa_desconfirmacoes(pessoa_id, motivo, criado_em, pessoas(nome)),
       atividade:atividades(id, titulo, tipo, prazo, status_evento)
       `)
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * Datas para o calendário do dashboard: atividades/eventos/entrevistas e
 * subtarefas com prazo definido, mais reuniões agendadas. RLS garante a
 * visibilidade. Devolve arrays crus — o dashboard filtra e molda.
 */
/**
 * Decisões aprovadas em reuniões que ainda não viraram atividade/evento
 * — para o widget "decisões à espera de execução" no painel.
 * Visível a todos os membros: a pressão para executar decisões é de toda
 * a equipa, não só da coordenação.
 */
export async function listarPlanosSemAtividade() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reuniao_planos')
    .select(
      `id, titulo, prazo, decidido_em, criado_em,
       reuniao:reunioes!inner(id, titulo, estado,
         participantes:reuniao_participantes(pessoa_id))`
    )
    .eq('decisao', 'aprovado')
    .is('atividade_id', null)
    .order('decidido_em', { ascending: true })
    .limit(20)

  return data ?? []
}

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
       local, materiais, orcamento, publico_alvo, publico_esperado, publico_real,
       atividade_materiais(id, nome, ordem, feito, feito_em, feito_por:pessoas(id, nome)),
       criado_por:pessoas!atividades_criado_por_fkey(id, nome),
       atividade_responsaveis(pessoa_id, pessoas(id, nome)),
       atividade_entidades(entidade_id, papel, entidades(id, nome, tipo)),
       atividade_profissionais(profissional_id, profissionais(id, nome, profissao, instituicao, telefone, email))`
    )
    .eq('id', id)
    .order('ordem', { referencedTable: 'atividade_materiais', ascending: true })
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
      `id, titulo, tipo, estado, data_hora, local, visibilidade, resumo_publicado_em, criado_em,
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
      `id, titulo, tipo, estado, data_hora, local, pauta, visibilidade, resumo, resumo_publicado_em, criado_em,
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
  const [ativas, subtarefas, convites] = await Promise.all([
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
    // Convites de entrevista do membro — histórico de participações
    supabase
      .from('entrevista_participantes')
      .select('status, atividades(id, titulo, prazo)')
      .eq('pessoa_id', pessoaId)
      .limit(100),
  ])

  // Falha silenciosa: a carga é um extra do perfil, não o essencial
  if (ativas.error) console.error('[dados] atividades do membro:', ativas.error.message)
  if (subtarefas.error) console.error('[dados] subtarefas do membro:', subtarefas.error.message)
  if (convites.error) console.error('[dados] entrevistas do membro:', convites.error.message)

  const entrevistas = (convites.data ?? [])
    .filter((c) => c.atividades)
    .map((c) => ({ ...c.atividades, meu_status: c.status }))
    // Histórico: da mais recente para a mais antiga
    .sort((a, b) => String(b.prazo ?? '').localeCompare(String(a.prazo ?? '')))

  return {
    atividades: ativas.data ?? [],
    subtarefas: subtarefas.data ?? [],
    entrevistas,
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

/**
 * Conteúdos para redes sociais (calendário editorial). A partir de
 * uma data de referência (por omissão hoje) — a lista e o calendário
 * mostram o futuro sem date barrar o passado recente (contexto).
 */
export async function listarConteudoRedes({ aPartirDe } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('conteudo_redes')
    .select('id, titulo, descricao, plataforma, data_publicacao, estado, link_publicacao, ativo, criado_em, criado_por:pessoas!conteudo_redes_criado_por_fkey(id, nome)')
    .order('data_publicacao', { ascending: true })

  if (aPartirDe) query = query.gte('data_publicacao', aPartirDe)
  else query = query.gte('data_publicacao', new Date().toISOString().slice(0, 10))

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

/** Canal DM entre dois membros — ids ordenados para o canal ser estável. */
export function canalDM(a, b) {
  return a < b ? `dm:${a}:${b}` : `dm:${b}:${a}`
}

/** Mensagens de um canal, cronológico (RLS garante a visibilidade). */
export async function listarMensagens(canal) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mensagens')
    .select(
      'id, conteudo, criado_em, editado_em, apagada_em, autor_id, autor:pessoas!mensagens_autor_id_fkey(id, nome)'
    )
    .eq('canal', canal)
    .order('criado_em', { ascending: true })
    .limit(300)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Conversas DM do membro — última mensagem de cada canal + parceiro.
 * RLS devolve só os canais em que participo; agrupar aqui evita
 * queries por conversa.
 */
export async function listarConversasDM(meuId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mensagens')
    .select('canal, conteudo, criado_em, autor_id, apagada_em')
    .like('canal', 'dm:%')
    .order('criado_em', { ascending: false })
    .limit(500)

  if (error) throw new Error(error.message)

  const vistos = new Map()
  for (const m of data ?? []) {
    if (vistos.has(m.canal)) continue
    const [, a, b] = m.canal.split(':')
    if (a !== meuId && b !== meuId) continue
    vistos.set(m.canal, { canal: m.canal, parceiroId: a === meuId ? b : a, ultima: m })
  }
  const conversas = [...vistos.values()]
  if (!conversas.length) return []

  const { data: pessoas } = await supabase
    .from('pessoas')
    .select('id, nome, role, ativo')
    .in('id', conversas.map((c) => c.parceiroId))
  const nomes = new Map((pessoas ?? []).map((p) => [p.id, p]))

  return conversas
    .map((c) => ({
      ...c,
      parceiro: nomes.get(c.parceiroId) ?? { id: c.parceiroId, nome: 'Membro', role: 'admin', ativo: false },
    }))
    .sort((x, y) => new Date(y.ultima.criado_em) - new Date(x.ultima.criado_em))
}

/**
 * Não lidas por conversa DM (para os pontos no hub): o instante da
 * última leitura de cada canal do membro + as mensagens dele depois
 * desse instante, contadas numa query só.
 */
export async function naoLidasDM(meuId) {
  const supabase = await createClient()

  // Os meus recibos — um por canal dm: meu
  const { data: recibos } = await supabase
    .from('mensagens_lidas')
    .select('canal, lido_em')
    .eq('pessoa_id', meuId)
    .like('canal', 'dm:%')
  const ultimoLido = new Map((recibos ?? []).map((r) => [r.canal, r.lido_em]))

  // Todas as mensagens dm que posso ver (RLS) — filtro aqui por canal
  const { data: msgs } = await supabase
    .from('mensagens')
    .select('canal, criado_em, autor_id')
    .like('canal', 'dm:%')
    .neq('autor_id', meuId)
    .limit(1000)

  const contagem = new Map()
  for (const m of msgs ?? []) {
    const [, a, b] = m.canal.split(':')
    if (a !== meuId && b !== meuId) continue
    const lido = ultimoLido.get(m.canal)
    if (lido && new Date(m.criado_em) <= new Date(lido)) continue
    contagem.set(m.canal, (contagem.get(m.canal) ?? 0) + 1)
  }
  return contagem // Map canal → não lidas (0 = nada pendente)
}

/**
 * Total de mensagens não lidas para o badge da navegação: DMs + canais
 * de atividade e reunião em que participo. Uma query por família.
 */
export async function totalNaoLidas(meuId, role) {
  const supabase = await createClient()

  const [recibos, dms, deAtividades, deReunioes] = await Promise.all([
    // Um recibo meu por canal (o mais recente prevalece)
    supabase
      .from('mensagens_lidas')
      .select('canal, lido_em')
      .eq('pessoa_id', meuId),
    supabase
      .from('mensagens')
      .select('canal, criado_em')
      .like('canal', 'dm:%')
      .neq('autor_id', meuId)
      .limit(1000),
    supabase
      .from('atividade_responsaveis')
      .select('atividade_id')
      .eq('pessoa_id', meuId),
    role === 'super_admin'
      ? supabase.from('reunioes').select('id').eq('visibilidade', 'coordenacao')
      : supabase.from('reuniao_participantes').select('reuniao_id').eq('pessoa_id', meuId),
  ])

  const ultimoLido = new Map()
  for (const r of recibos.data ?? []) {
    const antes = ultimoLido.get(r.canal)
    if (!antes || new Date(r.lido_em) > new Date(antes)) ultimoLido.set(r.canal, r.lido_em)
  }

  const contar = (msgs) => {
    let n = 0
    for (const m of msgs ?? []) {
      const lido = ultimoLido.get(m.canal)
      if (lido && new Date(m.criado_em) <= new Date(lido)) continue
      n += 1
    }
    return n
  }

  const idsAtividades = (deAtividades.data ?? []).map((r) => r.atividade_id)
  const idsReunioes = (deReunioes.data ?? []).map((r) => r.reuniao_id ?? r.id)

  const canais = [
    ...(idsAtividades.length ? idsAtividades.map((id) => `atividade:${id}`) : []),
    ...(idsReunioes.length ? idsReunioes.map((id) => `reuniao:${id}`) : []),
  ]
  let deCanais = 0
  if (canais.length) {
    const { data: msgsCanais } = await supabase
      .from('mensagens')
      .select('canal, criado_em')
      .in('canal', canais)
      .neq('autor_id', meuId)
      .limit(1000)
    deCanais = contar(msgsCanais)
  }

  return contar(dms.data) + deCanais
}

/** Marca um canal como lido AGORA (upsert do recibo do membro). */
export async function marcarCanalLido(canal) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mensagens_lidas')
    .upsert({ canal, pessoa_id: (await getUtilizadorAtual()).pessoa.id, lido_em: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

/**
 * Anúncios da coordenação para toda a equipa — os ativos, do mais
 * recente. Respeita o prazo opcional de expiração. Usado na homepage
 * (banda destacada) e em /anuncios (histórico).
 */
export async function listarAnuncios() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('anuncios')
    .select(
      'id, titulo, corpo, criado_em, expira_em, ativo, reuniao_id, reuniao:reunioes(id, titulo), autor:pessoas(id, nome)'
    )
    .eq('ativo', true)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Histórico de entrevistas por profissional externo: uma query para
 * todos, agrupável por profissional_id na página. Serve para o
 * "entrevistas dadas: N" no perfil de cada profissional da lista.
 */
export async function listarEntrevistasPorProfissional() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('atividade_profissionais')
    .select('profissional_id, atividades(id, titulo, tipo, prazo)')
    .not('atividades', 'is', null)
    .limit(500)

  if (error) {
    // Falha silenciosa: o histórico é um extra da lista
    console.error('[dados] entrevistas por profissional:', error.message)
    return []
  }

  return (data ?? [])
    .map((l) => ({ profissional_id: l.profissional_id, atividade: l.atividades }))
    .sort((a, b) => String(b.atividade?.prazo ?? '').localeCompare(String(a.atividade?.prazo ?? '')))
}
