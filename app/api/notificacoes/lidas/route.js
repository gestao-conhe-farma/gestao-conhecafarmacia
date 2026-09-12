import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/notificacoes/lidas
 *   { id }   → marca uma como lida
 *   {}       → marca TODAS as minhas como lidas
 * A RLS garante que só as próprias linhas são tocadas.
 */
export async function POST(request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Sem sessão.' }, { status: 401 })

  let body = {}
  try {
    body = await request.json()
  } catch {
    // corpo vazio → marcar todas
  }

  if (body?.id) {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', body.id)
      .eq('pessoa_id', user.id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 400 })
  } else {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('pessoa_id', user.id)
      .eq('lida', false)
    if (error) return NextResponse.json({ erro: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
