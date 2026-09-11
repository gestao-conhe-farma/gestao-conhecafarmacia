import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Proxy (middleware) do Next 16: renova a sessão Supabase em todas as rotas
 * e protege as páginas internas. Sem i18n aqui — a app de gestão é PT-only.
 *
 * Limite absoluto de sessão: 4 horas desde o login, mesmo com atividade.
 * O instante do login vive no cookie httpOnly cf_sessao_inicio (definido em
 * /api/auth/login, maxAge 4h). Quando falta ou está velho demais → fora.
 */
const LIMITE_SESSAO_MS = 4 * 60 * 60 * 1000
const COOKIE_SESSAO = 'cf_sessao_inicio'

/** Copia os cookies (incl. remoções feitas pelo signOut) para a resposta final. */
function copiarCookies(origem, destino) {
  origem.cookies.getAll().forEach((c) => destino.cookies.set(c))
}

export async function proxy(request) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: não colocar código entre createServerClient e supabase.auth.getUser().
  let user = null
  let mfaPendente = false
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null

  // 2FA: se a conta tem segunda camada e a sessão ainda está só em
  // aal1 (primeiro fator verificado), o utilizador tem de completar o
  // desafio em /login/mfa antes de tocar na app.
    if (user) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      mfaPendente = aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2'
    }
  } catch {
    // Supabase indisponível: segue sem sessão (páginas protegidas falham fechadas).
  }

  const rotasPublicas = ['/login', '/login/mfa']
  const isPublic = rotasPublicas.some((r) => pathname === r || pathname.startsWith(r + '/'))

  // Rotas de API: apenas renovar a sessão e seguir — NUNCA redirecionar.
  // (Os route handlers fazem a sua própria validação; um redirect 307 aqui
  // partia o fetch do login e produzia o erro genérico "Erro de rede".)
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Sessão válida mas sem registo em pessoas → fora (a menos que seja /setup,
  // usado para bootstrap do primeiro super_admin).
  if (user && !isPublic) {
    const { data: pessoa } = await supabase
      .from('pessoas')
      .select('id')
      .eq('id', user.id)
      .single()
    if (!pessoa) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      const res = NextResponse.redirect(url)
      return copiarCookies(supabaseResponse, res)
    }
  }

  // Limite absoluto: 4h desde o login, mesmo com atividade. Se o cookie
  // desapareceu (expirou no browser) ou é mais velho que 4h → fora.
  // Tolerante aos dois formatos: ISO (atual) e epoch-ms (deploy anterior).
  if (user && !isPublic) {
    const bruto = request.cookies.get(COOKIE_SESSAO)?.value
    const inicio = /^\d+$/.test(bruto ?? '') ? Number(bruto) : Date.parse(bruto ?? '')
    if (Number.isNaN(inicio) || Date.now() - inicio > LIMITE_SESSAO_MS) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('motivo', 'expirada')
      const res = NextResponse.redirect(url)
      return copiarCookies(supabaseResponse, res)
    }
  }

  // Desafio 2FA pendente: tudo fora de /login/mfa e /api → o desafio
  if (user && mfaPendente && !pathname.startsWith('/login/mfa') && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login/mfa'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Já autenticado (com 2FA completo) → nunca ver login
  if (user && !mfaPendente && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
