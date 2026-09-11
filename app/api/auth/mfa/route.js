import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/mfa — segundo passo do login com 2FA.
 * challengeAndVerify cria o desafio e valida o código TOTP numa só
 * chamada; se verificar, a sessão é promovida de aal1 para aal2 e o
 * middleware deixa entrar na app.
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 })
  }

  const { factorId, codigo } = body ?? {}
  if (!factorId || !/^[0-9]{6}$/.test((codigo ?? '').trim())) {
    return NextResponse.json({ erro: 'Código inválido — são 6 dígitos.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: codigo.trim() })

  if (error) {
    console.error('[api/auth/mfa] verificação falhou', error.message)
    return NextResponse.json({ erro: 'Código incorreto ou expirado — espera um novo código.' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
