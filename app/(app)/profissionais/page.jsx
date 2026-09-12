import { createClient, exigirUtilizador } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listarEntrevistasPorProfissional } from '@/lib/dados'
import ListaProfissionais from './ListaProfissionais'

export const metadata = { title: 'Profissionais' }

export default async function PaginaProfissionais({ searchParams }) {
  const { pessoa } = await exigirUtilizador()
  if (!pessoa) redirect('/login')

  const { q, ver } = await searchParams
  const filtro = (q ?? '').trim()
  const mostrarInativos = ver === 'todos'

  const supabase = await createClient()
  let query = supabase
    .from('profissionais')
    .select('*')
    .order('ativo', { ascending: false })
    .order('nome', { ascending: true })

  if (!mostrarInativos) query = query.eq('ativo', true)
  if (filtro) query = query.or(`nome.ilike.%${filtro}%,profissao.ilike.%${filtro}%,instituicao.ilike.%${filtro}%`)

  const [{ data }, historico] = await Promise.all([
    query,
    listarEntrevistasPorProfissional(),
  ])

  return (
    <div className="container-app max-w-4xl">
      <div className="page-head">
        <p className="kicker">Roster da equipa</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Profissionais
        </h1>
        <p className="text-brand-deep/60 mt-2 leading-relaxed max-w-2xl">
          Profissionais de saúde e áreas afins que podemos convidar para
          entrevistas em TVs, rádios e eventos — construída por toda a equipa.
          Os contactos são apenas para convites a atividades da Conheça Farmácia.
        </p>
      </div>

      <ListaProfissionais
        iniciais={data ?? []}
        historicoEntrevistas={historico}
        filtroInicial={filtro}
        verInativos={mostrarInativos}
        ehSuper={pessoa.role === 'super_admin'}
      />
    </div>
  )
}
