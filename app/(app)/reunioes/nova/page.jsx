import { redirect } from 'next/navigation'
import { exigirUtilizador } from '@/lib/supabase/server'
import { listarEquipa, obterConfiguracaoReunioes } from '@/lib/dados'
import FormNovaReuniao from './FormNovaReuniao'

export const metadata = { title: 'Nova reunião' }

export default async function PaginaNovaReuniao() {
  const { pessoa } = await exigirUtilizador()
  if (pessoa.role !== 'super_admin') redirect('/reunioes')

  const [equipa, config] = await Promise.all([
    listarEquipa(),
    obterConfiguracaoReunioes(),
  ])

  return (
    <div className="container-app max-w-3xl">
      <div className="page-head">
        <p className="kicker">Coordenação</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Nova reunião
        </h1>
        <p className="text-brand-deep/60 mt-2 leading-relaxed max-w-xl">
          Convoca a equipa — mensal pela regra definida ou urgente para decisões
          imediatas. Os convocados confirmam presença.
        </p>
      </div>

      <div className="card p-6 md:p-8">
        <FormNovaReuniao equipa={equipa} pessoaAtualId={pessoa.id} config={config} />
      </div>
    </div>
  )
}
