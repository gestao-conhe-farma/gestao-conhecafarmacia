import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const resposta = NextResponse.json({ ok: true })
  resposta.cookies.set('cf_sessao_inicio', '', { path: '/', maxAge: 0 })
  return resposta
}
