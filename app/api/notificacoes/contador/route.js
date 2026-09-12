import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/notificacoes/contador → { naoLidas } do utilizador atual. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ naoLidas: 0 })

  const { count } = await supabase
    .from('notificacoes')
    .select('id', { count: 'exact', head: true })
    .eq('pessoa_id', user.id)
    .eq('lida', false)

  return NextResponse.json({ naoLidas: count ?? 0 })
}
