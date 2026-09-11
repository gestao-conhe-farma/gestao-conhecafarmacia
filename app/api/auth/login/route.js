import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

// Loga no console do servidor (visível nos Function Logs da Vercel).
// Nunca logar a password — só o email, código e mensagem do Supabase.
function logErro(fase, detalhes) {
  console.error(`[api/auth/login] ${fase}`, JSON.stringify(detalhes, null, 2))
}

// Rate limiting por conta: 8 falhas em 15 minutos bloqueia a conta
// temporariamente. O registo vive em login_falhas (escrito via
// service_role, RLS fecha a leitura a todos exceto super_admin).
const JANELA_MINUTOS = 15
const MAX_FALHAS = 8

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

  const emailNormalizado = String(email).trim().toLowerCase()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? null

  // 3) Supabase login
  try {
    const admin = await createAdminClient()

    // 3.a) Rate limit por conta — verificado ANTES do signIn.
    const desde = new Date(Date.now() - JANELA_MINUTOS * 60 * 1000).toISOString()
    const { count: falhasRecentes } = await admin
      .from('login_falhas')
      .select('id', { count: 'exact', head: true })
      .eq('email', emailNormalizado)
      .gte('criado_em', desde)

    if ((falhasRecentes ?? 0) >= MAX_FALHAS) {
      logErro('rate limit atingido', { email: emailNormalizado, falhas: falhasRecentes, ip })
      return NextResponse.json(
        { erro: 'Demasiadas tentativas. Espera 15 minutos antes de tentar de novo.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: emailNormalizado,
      password,
    })

    if (error) {
      // 3.b) Registar a falha (best-effort: se falhar, o login continua a ser recusado)
      admin
        .from('login_falhas')
        .insert({ email: emailNormalizado, ip, user_agent: userAgent })
        .then(({ error: erroLog }) => {
          if (erroLog) console.error('[api/auth/login] falha ao registar tentativa', erroLog.message)
        })

      const mensagem =
        error.message === 'Invalid login credentials'
          ? 'Credenciais inválidas. Verifica o email e a palavra-passe.'
          : error.message

      logErro('signInWithPassword falhou', {
        email: emailNormalizado,
        status: error.status,
        code: error.code,
        message: error.message,
        ip,
      })

      return NextResponse.json(
        { erro: mensagem, codigo: error.code ?? null },
        { status: error.status && error.status >= 400 && error.status < 600 ? error.status : 401 }
      )
    }

    // Sessão válida: limpa o histórico de falhas desta conta (novo início "limpo")
    admin.from('login_falhas').delete().eq('email', emailNormalizado).then(
      ({ error: erroLimpeza }) => {
        if (erroLimpeza) console.error('[api/auth/login] falha ao limpar histórico', erroLimpeza.message)
      }
    )

    // Marca o instante do login: o proxy usa-o para aplicar o limite
    // absoluto de 4h (cookie httpOnly, desaparece sozinho em 4h).
    const resposta = NextResponse.json({ ok: true })
    resposta.cookies.set('cf_sessao_inicio', String(Date.now()), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 4 * 60 * 60,
    })
    return resposta
  } catch (errSupabase) {
    // Ex.: env vars em falta na Vercel, rede, etc.
    logErro('exceção no cliente Supabase', {
      message: errSupabase?.message,
      name: errSupabase?.name,
      stack: errSupabase?.stack?.split('\n').slice(0, 4),
      envUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      envKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    })

    return NextResponse.json(
      { erro: 'Erro no servidor de autenticação. Tenta novamente.' },
      { status: 500 }
    )
  }
}
