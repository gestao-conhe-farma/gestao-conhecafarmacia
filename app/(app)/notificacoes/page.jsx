import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ListaNotificacoes from './ListaNotificacoes'

export const metadata = { title: 'Notificações' }

export default async function PaginaNotificacoes() {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) redirect('/login')

  const supabase = await createClient()
  const { data } = await supabase
    .from('notificacoes')
    .select('id, tipo, titulo, corpo, link, lida, criado_em')
    .eq('pessoa_id', pessoa.id)
    .order('criado_em', { ascending: false })
    .limit(100)

  return (
    <div className="container-app max-w-2xl">
      <div className="page-head">
        <p className="kicker">A tua atividade</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Notificações
        </h1>
        <p className="text-brand-deep/60 mt-2 leading-relaxed">
          Convites, atribuições e publicações que te dizem respeito.
        </p>
      </div>

      <ListaNotificacoes iniciais={data ?? []} />
    </div>
  )
}
