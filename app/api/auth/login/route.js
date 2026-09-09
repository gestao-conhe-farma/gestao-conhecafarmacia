import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ erro: 'Email e palavra-passe são obrigatórios.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const mensagem =
      error.message === 'Invalid login credentials'
        ? 'Credenciais inválidas. Verifica o email e a palavra-passe.'
        : error.message
    return NextResponse.json({ erro: mensagem }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
