import { getUtilizadorAtual } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listarEquipa, listarAtividades } from '@/lib/dados'
import FormNovaAtividade from './FormNovaAtividade'

export const metadata = { title: 'Nova atividade' }

export default async function PaginaNovaAtividade() {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') redirect('/')

  const [equipa, todas] = await Promise.all([
    listarEquipa(),
    listarAtividades({ tipo: 'evento' }),
  ])
  // Eventos ainda não concluídos podem receber atividades subordinadas
  const eventos = todas.filter((ev) => ev.status_evento !== 'concluida')

  return (
    <div className="container-app max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-brand-deep mb-2">
        Nova atividade
      </h1>
      <p className="text-brand-deep/60 mb-8">
        Atividades de topo criadas pela coordenação nascem já aprovadas e ficam
        visíveis para toda a equipa.
      </p>

      <div className="card p-6 md:p-8">
        <FormNovaAtividade equipa={equipa} pessoaAtualId={pessoa.id} eventos={eventos} />
      </div>
    </div>
  )
}
