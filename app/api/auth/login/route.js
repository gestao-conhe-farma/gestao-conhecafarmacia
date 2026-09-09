import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Loga no console do servidor (visível nos Function Logs da Vercel).
// Nunca logar a password — só o email, código e mensagem do Supabase.
function logErro(fase, detalhes) {
  console.error(`[api/auth/login] ${fase}`, JSON.stringify(detalhes, null, 2))
}

export async function POST(request) {
  // 1) Body inválido / não-JSON
  let body
  try {
    body = await request.json()
  } catch (parseError) {
    logErro('body não-JSON', { message: parseError?.message })
    return NextResponse.json(
      { erro: 'Pedido inválido.' },
      { status: 400 }
    )
  }

  const { email, password } = body ?? {}

  // 2) Campos em falta
  if (!email || !password) {
    logErro('campos em falta', { temEmail: Boolean(email), temPassword: Boolean(password) })
    return NextResponse.json(
      { erro: 'Email e palavra-passe são obrigatórios.' },
      { status: 400 }
    )
  }

  // 3) Supabase login
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const mensagem =
        error.message === 'Invalid login credentials'
          ? 'Credenciais inválidas. Verifica o email e a palavra-passe.'
          : error.message

      logErro('signInWithPassword falhou', {
        email,
        status: error.status,
        code: error.code,
        message: error.message,
      })

      return NextResponse.json(
        { erro: mensagem, codigo: error.code ?? null },
        { status: error.status && error.status >= 400 && error.status < 600 ? error.status : 401 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (errSupabase) {
    // Ex.: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY em falta na Vercel, rede, etc.
    logErro('exceção no cliente Supabase', {
      message: errSupabase?.message,
      name: errSupabase?.name,
      stack: errSupabase?.stack?.split('\n').slice(0, 4),
      envUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      envKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    })

    return NextResponse.json(
      {
        erro: 'Erro no servidor de autenticação. Tenta novamente.',
        detalhe: errSupabase?.message ?? String(errSupabase),
      },
      { status: 500 }
    )
  }
}
