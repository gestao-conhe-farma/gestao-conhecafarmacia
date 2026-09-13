export const BUCKET = 'documentos'
export const TAMANHO_MAX_MB = 50
export const TAMANHO_MAX_BYTES = TAMANHO_MAX_MB * 1024 * 1024

// =============================================================
// Catálogo de finalidades — "para que serve" cada documento.
// Fonte: docs/Ordem e Lógica Cartas - C F.txt + pastas do utilizador.
// O prefixo do código (ex.: CF-PAR em CF-PAR-001-2026) mapeia para a
// finalidade; documentos sem código usam a categoria como fallback.
// =============================================================
export const FINALIDADES_CODIGO = {
  'CF-MEM': 'Anúncios internos da equipa Conheça Farmácia — comunicação oficial entre membros.',
  'CF-PAR': 'Carta dirigida aos Parceiros do Conheça Farmácia.',
  'CF-PAT': 'Carta dirigida aos Patrocinadores de eventos do Conheça Farmácia.',
  'CF-REG': 'Carta às entidades reguladoras de saúde (OFA-CAPFA, ordens e seus membros).',
  'CF-SOL': 'Carta de solicitação da Conheça Farmácia — ex.: pedido de espaço para uma atividade.',
}

export const FINALIDADES_CATEGORIA = {
  'Cartas e Ofícios': 'Cartas e ofícios oficiais emitidos pelo Conheça Farmácia.',
  'Conteúdos': 'Guias e estratégias para a produção de conteúdo do Conheça Farmácia.',
  'Contratos e Acordos': 'Contratos e acordos firmados com parceiros e patrocinadores.',
  'Equipa': 'Documentos sobre a estrutura e organização das equipas.',
  'Ideias': 'Propostas e protótipos criativos em exploração.',
  'Políticas e Termos': 'Regras, políticas e termos que regem a atuação do Conheça Farmácia.',
}

/**
 * Sugere a descrição ("para que serve") a partir do código do documento
 * (prefixo antes do primeiro hífen duplo, ex.: CF-PAR-001-2026 → CF-PAR)
 * e, em falta, da categoria. Devolve null quando nada encaixa.
 */
export function sugerirFinalidade(codigo, categoriaNome) {
  if (codigo) {
    const m = String(codigo).toUpperCase().match(/^(CF-[A-Z]{3})\b/)
    if (m && FINALIDADES_CODIGO[m[1]]) return FINALIDADES_CODIGO[m[1]]
  }
  if (categoriaNome && FINALIDADES_CATEGORIA[categoriaNome]) {
    return FINALIDADES_CATEGORIA[categoriaNome]
  }
  return null
}

// MIME types aceites no upload
// text/html foi removido: HTML armazenado é XSS armazenado — mesmo com
// o preview em iframe sandbox, basta uma mudança futura no visualizador
// para abrir o buraco. Quem precisa de partilhar um documento exporta
// para PDF.
export const MIME_ACEITES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
]

// Extensões amigáveis para o input
export const EXT_ACEITES = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg'

/** Extensões de ficheiro proibidas, mesmo que o MIME passe no check. */
export const EXT_PROIBIDAS = ['.html', '.htm', '.svg', '.js', '.mjs']

/**
 * Verifica se um ficheiro é aceitável (tipo + tamanho).
 * Nota: alguns browsers/OS não enviam o MIME correto para .docx —
 * usamos a extensão como fallback.
 */
export function ficheiroValido(ficheiro) {
  const ext = '.' + (ficheiro.name.split('.').pop() || '').toLowerCase()
  const extOk = EXT_ACEITES.split(',').includes(ext)
  const mimeOk = !ficheiro.type || MIME_ACEITES.includes(ficheiro.type)
  if (!extOk || !mimeOk) {
    return { ok: false, erro: `Tipo de ficheiro não suportado (${ext}).` }
  }
  if (ficheiro.size > TAMANHO_MAX_BYTES) {
    return {
      ok: false,
      erro: `Ficheiro demasiado grande (máx. ${TAMANHO_MAX_MB} MB).`,
    }
  }
  return { ok: true }
}

/** Bytes → texto legível. */
export function formatarTamanho(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Parte um código de carta nos seus componentes.
 * 'CF-PAR-003-2026' → { prefixo: 'CF-PAR', numero: 3, ano: 2026 }
 * Devolve null se não encaixar no formato CF-XXX-NNN-AAAA.
 */
export function partirCodigo(codigo) {
  const m = String(codigo ?? '').toUpperCase().trim().match(/^(CF-[A-Z]{3})-(\d+)-(\d{4})$/)
  if (!m) return null
  return { prefixo: m[1], numero: parseInt(m[2], 10), ano: parseInt(m[3], 10) }
}

/**
 * Caminho único no bucket: {categoria}/{ano}/{timestamp}_{nome-seguro}
 * Nunca confiamos no nome original para o path.
 */
export function construirPath(categoriaNome, nomeFicheiro) {
  const ano = new Date().getFullYear()
  const nomeSeguro = nomeFicheiro
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80)
  const catSegura = (categoriaNome || 'geral')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase()
  return `${catSegura}/${ano}/${Date.now()}_${nomeSeguro}`
}
