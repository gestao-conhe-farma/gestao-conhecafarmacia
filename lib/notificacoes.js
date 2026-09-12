import { createAdminClient } from '@/lib/supabase/server'
import { construirEmail } from '@/lib/emails-templates'

/**
 * Notificações da equipa — in-app + email.
 *
 * - In-app: linha na tabela `notificacoes` (escrita via service_role).
 *   Aparece no sino da topbar e em /notificacoes.
 * - Email: template por tipo de evento (lib/emails-templates.js),
 *   enviado via Resend SE `RESEND_API_KEY` estiver definida. Sem a key,
 *   funciona só in-app — degradação graciosa.
 *
 * Best-effort por conceção: nenhuma falha aqui pode rebentar a ação
 * que a originou (criar reunião, atribuir subtarefa, etc.).
 */

const FROM_PADRAO = 'Gestão Conheça Farmácia <gestao@conhecafarmacia.com>'

/**
 * Envia notificações a uma lista de pessoas.
 * @param {string[]} pessoaIds  destinatários (excluídos os vazios)
 * @param {{tipo:string, titulo:string, corpo?:string, link?:string,
 *          soInApp?:boolean}} n  soInApp: não envia email (ex.: avisos
 *          de painel interno da coordenação — alto volume, baixa urgência)
 */
export async function notificar(pessoaIds, { tipo, titulo, corpo = null, link = null, soInApp = false }) {
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

    if (soInApp) return

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

    await Promise.allSettled(
      pessoas
        .filter((p) => Boolean(p.email))
        .map(async (p) => {
          try {
            // Assunto + HTML específicos do tipo de evento, com o nome
            // do destinatário no rodapé
            const { assunto, html } = construirEmail(
              { tipo, titulo, corpo, link },
              { appUrl, nomeDestinatario: p.nome }
            )

            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ from, to: [p.email], subject: assunto, html }),
            })

            if (!res.ok) {
              const detalhe = await res.text().catch(() => '')
              console.error('[notificacoes] email falhou', p.email, res.status, detalhe.slice(0, 200))
            }
          } catch (e) {
            console.error('[notificacoes] email exceção', p.email, e?.message)
          }
        })
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

/**
 * Notifica a coordenação (super_admins) — sempre in-app, nunca email:
 * são avisos de painel interno (aprovações pendentes, decisões à
 * espera de conversão), de alto volume e baixa urgência. Se o autor
 * é ele próprio coordenador, fica de fora.
 * @param {string} autorId  quem gerou o evento (para exclusão)
 */
export async function notificarCoordenacao(autorId, n) {
  try {
    const admin = await createAdminClient()
    const { data: coordenacao, error } = await admin
      .from('pessoas')
      .select('id')
      .eq('role', 'super_admin')
      .eq('ativo', true)
    if (error || !coordenacao?.length) {
      if (error) console.error('[notificacoes] falha ao buscar coordenacao', error.message)
      return
    }
    await notificar(semAutor(coordenacao.map((c) => c.id), autorId), { ...n, soInApp: true })
  } catch (e) {
    console.error('[notificacoes] exceção coordenacao', e?.message)
  }
}
