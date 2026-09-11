import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/sessao — marca o instante do login para o limite
 * absoluto de 4h (cookie cf_sessao_inicio, lido pelo proxy).
 *
 * Necessário porque o login por passkey/biometria NÃO passa por
 * /api/auth/login: a sessão nasce no browser (signInWithPasskey) e,
 * sem este carimbo, o proxy expulsaria o utilizador de imediato
 * (cookie em falta → "sessão expirada").
 *
 * Segurança: só faz o quê? grava um carimbo temporal SE já houver
 * sessão válida — não concede nenhum acesso novo.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ erro: 'Sem sessão.' }, { status: 401 })
  }

  const resposta = NextResponse.json({ ok: true })
  resposta.cookies.set('cf_sessao_inicio', new Date().toISOString(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 4 * 60 * 60,
  })
  return resposta
}
