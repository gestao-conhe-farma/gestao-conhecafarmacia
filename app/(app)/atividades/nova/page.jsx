import { exigirUtilizador } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listarEquipa, listarAtividades } from '@/lib/dados'
import FormNovaAtividade from './FormNovaAtividade'

export const metadata = { title: 'Nova atividade' }

export default async function PaginaNovaAtividade() {
  const { pessoa } = await exigirUtilizador()
  if (pessoa.role !== 'super_admin') redirect('/')

  const [equipa, todas] = await Promise.all([
    listarEquipa(),
    listarAtividades({ tipo: 'evento' }),
  ])
  // Eventos ainda não concluídos podem receber atividades subordinadas
  const eventos = todas.filter((ev) => ev.status_evento !== 'concluida')

  return (
    <div className="container-app max-w-3xl">
      {/* Cabeçalho editorial com régua forte */}
      <div className="page-head">
        <p className="kicker">Coordenação</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Nova atividade
        </h1>
        <p className="text-brand-deep/60 mt-2 leading-relaxed max-w-xl">
          Atividades de topo criadas pela coordenação nascem já aprovadas e
          ficam visíveis para toda a equipa.
        </p>
      </div>

      <FormNovaAtividade equipa={equipa} pessoaAtualId={pessoa.id} eventos={eventos} />
    </div>
  )
}
