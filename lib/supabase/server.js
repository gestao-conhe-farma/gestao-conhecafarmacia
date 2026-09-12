import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Cliente Supabase para Server Components / Server Actions / Route Handlers.
 * Usa os cookies do pedido para manter a sessão do utilizador.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        // Passkeys (biometria) — mesma flag do cliente browser; exigida
        // para auth.passkey.* no servidor (ex.: listar fatores).
        experimental: { passkey: true },
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado a partir de um Server Component — o proxy renova a sessão.
          }
        },
      },
    }
  )
}

/**
 * Cliente com service_role (ignora RLS). USAR APENAS em servidor,
 * para a gestão de contas (Admin API). Nunca expor ao browser.
 */
export async function createAdminClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Utilizador autenticado + registo em pessoas (null se não autenticado,
 * sem registo em pessoas, ou desativado — defesa em profundidade: o ban
 * Auth é a barreira principal, isto cobre desativações feitas por SQL).
 *
 * Retry único no getUser: o Supabase renova o access token sozinho e,
 * em corridas de refresh/blips de rede, getUser pode falhar uma vez —
 * devolver null nesse caso rebentava páginas em "cannot destructure
 * 'pessoa' of null" que desapareciam com refresh.
 */
export async function getUtilizadorAtual() {
  const supabase = await createClient()
  let user = null
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    if (u) {
      user = u
      break
    }
    if (tentativa === 0) await new Promise((r) => setTimeout(r, 300))
  }
  if (!user) return null

  const { data: pessoa } = await supabase
    .from('pessoas')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!pessoa || pessoa.ativo === false) return null
  return { user, pessoa }
}

/**
 * Para páginas: como getUtilizadorAtual, mas em vez de null faz
 * redirect para /login. O middleware já barra anónimos; isto cobre a
 * janela de corrida em que a página perde o refresh de token do layout
 * — a página nunca deve rebentar a destruturar null.
 */
export async function exigirUtilizador() {
  const atual = await getUtilizadorAtual()
  if (!atual) redirect('/login')
  return atual
}
