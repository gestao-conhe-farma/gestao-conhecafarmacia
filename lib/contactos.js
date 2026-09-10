/**
 * Helpers de contactos (telefone / WhatsApp), partilhados entre
 * Server e Client Components — funções puras, sem dependências.
 *
 * Números guardados em E.164: sinal +, código do país e 8–14 dígitos
 * (ex.: +258841234567). A validação forte vive no servidor
 * (atualizarContactos) e como CHECK na base de dados.
 */

const E164 = /^\+[1-9]\d{8,14}$/

/**
 * Normaliza para E.164: aceita separadores, e converte o prefixo
 * internacional "00" para "+" (ex.: 00258841234567 → +258841234567).
 * Devolve null se vazio. Não adiciona código do país — isso é validado
 * a seguir com validarNumeroE164.
 */
export function normalizarNumero(valor) {
  let v = (valor ?? '').trim()
  if (!v) return null
  v = v.replace(/[\s().\-]/g, '') // separadores visuais
  if (v.startsWith('00')) v = '+' + v.slice(2)
  const digitos = v.replace(/\D/g, '')
  if (!digitos) return null
  return v.startsWith('+') ? `+${digitos}` : digitos
}

/** Verifica o formato E.164 (+ e 9–15 dígitos). */
export function validarNumeroE164(valor) {
  return E164.test(valor ?? '')
}

/** Link para o teclado de chamadas do dispositivo. */
export function linkTelefone(numero) {
  return `tel:${numero}`
}

/** Link de conversa WhatsApp (wa.me — só dígitos, sem +). */
export function linkWhatsapp(numero) {
  return `https://wa.me/${String(numero ?? '').replace(/\D/g, '')}`
}
