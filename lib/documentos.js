export const BUCKET = 'documentos'
export const TAMANHO_MAX_MB = 50
export const TAMANHO_MAX_BYTES = TAMANHO_MAX_MB * 1024 * 1024

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
