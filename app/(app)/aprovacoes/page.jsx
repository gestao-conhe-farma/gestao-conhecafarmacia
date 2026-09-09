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
      {/* Cabeçalho editorial com régua forte */}
      <div className="page-head">
        <p className="kicker">Coordenação</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Aprovações
        </h1>
        <p className="text-brand-deep/60 mt-2 leading-relaxed max-w-xl">
          Subtarefas criadas por membros que aguardam a decisão da coordenação.
        </p>
      </div>

      <div>
        {pendentes.length === 0 ? (
          <p className="text-sm text-brand-deep/50 py-4">
            Tudo em ordem — sem subtarefas pendentes.
          </p>
        ) : (
          <ListaAprovacoes pendentes={pendentes} />
        )}
      </div>
    </div>
  )
}
