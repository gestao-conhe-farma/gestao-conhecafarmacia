import { createAdminClient } from '@/lib/supabase/server'

/**
 * Notificações da equipa — in-app + email (opcional).
 *
 * - In-app: linha na tabela `notificacoes` (escrita via service_role).
 *   Aparece no sino da topbar e em /notificacoes.
 * - Email: enviado via Resend SE `RESEND_API_KEY` estiver definida
 *   (Vercel env var). Sem a key, funciona só in-app — degradação
 *   graciosa, nunca bloqueia a ação do utilizador.
 *
 * Best-effort por conceção: nenhuma falha aqui pode rebentar a ação
 * que a originou (criar reunião, atribuir subtarefa, etc.).
 */

const FROM_PADRAO = 'Gestão Conheça Farmácia <gestao@conhecafarmacia.com>'

function emailHtml({ titulo, corpo, link, appUrl }) {
  const url = link ? `${appUrl}${link}` : appUrl
  return `<!doctype html>
<html lang="pt">
  <body style="margin:0;padding:24px;background:#f4f6f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2a26;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e3e8e5;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8aa398;">Conheça Farmácia · Gestão Interna</p>
      <h1 style="margin:0 0 12px;font-size:18px;color:#00493a;">${titulo}</h1>
      ${corpo ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#3d4a44;">${corpo}</p>` : ''}
      ${link ? `<a href="${url}" style="display:inline-block;background:#00493a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px;">Abrir na app</a>` : ''}
    </div>
    <p style="max-width:520px;margin:12px auto 0;font-size:11px;color:#9aa8a1;">Acesso restrito à equipa — recebeu porque é membro da plataforma.</p>
  </body>
</html>`
}

/**
 * Envia notificações a uma lista de pessoas.
 * @param {string[]} pessoaIds  destinatários (excluídos os vazios)
 * @param {{tipo:string, titulo:string, corpo?:string, link?:string}} n
 */
export async function notificar(pessoaIds, { tipo, titulo, corpo = null, link = null }) {
  try {
    const destinos = [...new Set((pessoaIds ?? []).filter(Boolean))]
    if (!destinos.length) return

    const admin = await createAdminClient()

    // 1) In-app: uma linha por destinatário (uma só query)
    const { error } = await admin.from('notificacoes').insert(
      destinos.map((pessoa_id) => ({ pessoa_id, tipo, titulo, corpo, link }))
    )
    if (error) {
      console.error('[notificacoes] insert falhou', error.message)
    }

    // 2) Email — só se a key do Resend existir
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return

    const from = process.env.RESEND_FROM || FROM_PADRAO
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gestao.conhecafarmacia.com'

    const { data: pessoas, error: errPessoas } = await admin
      .from('pessoas')
      .select('id, nome, email')
      .in('id', destinos)
    if (errPessoas || !pessoas?.length) {
      console.error('[notificacoes] falha ao buscar emails', errPessoas?.message)
      return
    }

    const html = emailHtml({ titulo, corpo, link, appUrl })
    const assunto = `[Gestão] ${titulo}`

    await Promise.allSettled(
      pessoas
        .filter((p) => Boolean(p.email))
        .map((p) =>
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from,
              to: [p.email],
              subject: assunto,
              html: html.replace(
                '</body>',
                `<p style="max-width:520px;margin:18px auto 0;font-size:12px;color:#6b7a72;">Olá ${p.nome},<br/>${''}</p></body>`
              ),
            }),
          }).then(async (r) => {
            if (!r.ok) {
              const detalhe = await r.text().catch(() => '')
              console.error('[notificacoes] email falhou', p.email, r.status, detalhe.slice(0, 200))
            }
          })
        )
    )
  } catch (e) {
    // Nunca rebenta a ação do utilizador por causa de uma notificação
    console.error('[notificacoes] exceção', e?.message)
  }
}

/**
 * Filtra da lista o próprio autor — não se notifica a si mesmo.
 */
export function semAutor(ids, autorId) {
  return (ids ?? []).filter((id) => id && id !== autorId)
}
