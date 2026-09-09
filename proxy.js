import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Proxy (middleware) do Next 16: renova a sessão Supabase em todas as rotas
 * e protege as páginas internas. Sem i18n aqui — a app de gestão é PT-only.
 */
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
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Supabase indisponível: segue sem sessão (páginas protegidas falham fechadas).
  }

  const rotasPublicas = ['/login', '/setup']
  const isPublic = rotasPublicas.some((r) => pathname === r || pathname.startsWith(r + '/'))

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
      return NextResponse.redirect(url)
    }
  }

  // Já autenticado → nunca ver login/setup
  if (user && pathname === '/login') {
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
