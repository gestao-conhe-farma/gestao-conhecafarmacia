import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ListaEntidades from './ListaEntidades'

export const metadata = { title: 'Entidades' }

export default async function PaginaEntidades({ searchParams }) {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) redirect('/login')

  const { tipo, ver } = await searchParams
  const filtroTipo = ['parceiro', 'patrocinador', 'instituicao', 'empresa'].includes(tipo) ? tipo : null
  const mostrarInativas = ver === 'todos'

  const supabase = await createClient()
  let query = supabase
    .from('entidades')
    .select('*')
    .order('ativo', { ascending: false })
    .order('nome', { ascending: true })

  if (!mostrarInativas) query = query.eq('ativo', true)
  if (filtroTipo) query = query.eq('tipo', filtroTipo)

  const { data } = await query

  return (
    <div className="container-app max-w-4xl">
      <div className="page-head">
        <p className="kicker">Memória institucional</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Entidades
        </h1>
        <p className="text-brand-deep/60 mt-2 leading-relaxed max-w-2xl">
          Parceiros, patrocinadores e instituições com que a equipa colabora —
          contactos, notas e histórico de atividades em comum.
        </p>
      </div>

      <ListaEntidades
        iniciais={data ?? []}
        tipoInicial={filtroTipo}
        verInativas={mostrarInativas}
        ehSuper={pessoa.role === 'super_admin'}
      />
    </div>
  )
}
