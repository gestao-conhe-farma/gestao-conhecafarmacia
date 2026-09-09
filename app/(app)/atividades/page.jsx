import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { listarAtividades } from '@/lib/dados'
import CartaoAtividade from '../CartaoAtividade'
import AbasTipo from '../AbasTipo'

export const metadata = { title: 'Atividades' }

export default async function PaginaAtividades({ searchParams }) {
  const { pessoa } = await getUtilizadorAtual()
  const params = await searchParams
  const tipo = params?.tipo || 'todas'

  const atividades = await listarAtividades({ tipo })

  return (
    <div className="container-app">
      {/* Cabeçalho editorial com régua forte */}
      <div className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Planeamento</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
              Atividades
            </h1>
            <p className="text-brand-deep/60 mt-2 max-w-xl leading-relaxed">
              Todas as atividades, eventos e entrevistas criadas pela coordenação.
            </p>
          </div>
          {pessoa.role === 'super_admin' && (
            <Link href="/atividades/nova" className="btn btn-primary shrink-0">
              <Plus size={16} />
              Nova atividade
            </Link>
          )}
        </div>
      </div>

      <div className="mb-6">
        <AbasTipo atual={tipo} />
      </div>

      {atividades.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={36} className="mx-auto mb-3 text-brand-accent/50" />
          <p className="font-semibold text-brand-deep">Sem atividades neste filtro</p>
          <p className="text-sm mt-1">
            {pessoa.role === 'super_admin'
              ? 'Cria uma nova atividade para começar.'
              : 'A coordenação ainda não criou nada aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {atividades.map((a) => (
            <CartaoAtividade key={a.id} atividade={a} />
          ))}
        </div>
      )}
    </div>
  )
}
