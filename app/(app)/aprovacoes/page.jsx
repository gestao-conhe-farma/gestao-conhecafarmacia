import { redirect } from 'next/navigation'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { listarSubtarefas } from '@/lib/dados'
import ListaAprovacoes from './ListaAprovacoes'

export const metadata = { title: 'Aprovações' }

export default async function PaginaAprovacoes() {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') redirect('/')

  const pendentes = await listarSubtarefas({ status: 'pendente_aprovacao' })

  return (
    <div className="container-app max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-brand-deep mb-2">
        Aprovações
      </h1>
      <p className="text-brand-deep/60 mb-8">
        Subtarefas criadas por membros que aguardam a decisão da coordenação.
      </p>

      <div className="card p-6 md:p-8">
        {pendentes.length === 0 ? (
          <p className="text-sm text-brand-deep/50 py-8 text-center">
            Tudo em ordem — sem subtarefas pendentes.
          </p>
        ) : (
          <ListaAprovacoes pendentes={pendentes} />
        )}
      </div>
    </div>
  )
}
