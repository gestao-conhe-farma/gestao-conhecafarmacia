import Link from 'next/link'
import { ClipboardList, History, Plus } from 'lucide-react'
import { exigirUtilizador } from '@/lib/supabase/server'
import { listarAtividades, atividadeJaPassou, ordenarPorPrazo } from '@/lib/dados'
import CartaoAtividade from '../CartaoAtividade'
import AbasTipo from '../AbasTipo'

export const metadata = { title: 'Atividades' }

export default async function PaginaAtividades({ searchParams }) {
  const { pessoa } = await exigirUtilizador()
  const params = await searchParams
  const tipo = params?.tipo || 'todas'
  const mostrarPassadas = params?.passadas === '1'

  const atividadesBrutas = await listarAtividades({ tipo })

  // Do prazo mais próximo ao mais distante; sem prazo no fim.
  // Por omissão esconde o passado (o hoje ainda conta como atual) —
  // o botão "Mostrar passadas" traz o histórico completo.
  const ordenadas = ordenarPorPrazo(atividadesBrutas)
  const visiveis = mostrarPassadas
    ? ordenadas
    : ordenadas.filter((a) => !a.prazo || !atividadeJaPassou(a.prazo))
  const nPassadas = ordenadas.length - visiveis.length

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
          <div className="flex items-center gap-3 shrink-0">
            {nPassadas > 0 && (
              <Link
                href={mostrarPassadas ? `/atividades${tipo !== 'todas' ? `?tipo=${tipo}` : ''}` : `/atividades?passadas=1${tipo !== 'todas' ? `&tipo=${tipo}` : ''}`}
                className="btn btn-ghost btn-small border border-brand-divider"
              >
                <History size={14} />
                {mostrarPassadas ? 'Ocultar passadas' : `Mostrar passadas (${nPassadas})`}
              </Link>
            )}
            {pessoa.role === 'super_admin' && (
              <Link href="/atividades/nova" className="btn btn-primary">
                <Plus size={16} />
                Nova atividade
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <AbasTipo atual={tipo} />
      </div>

      {visiveis.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={36} className="mx-auto mb-3 text-brand-accent/50" />
          <p className="font-semibold text-brand-deep">
            {nPassadas > 0 ? 'Só atividades passadas neste filtro' : 'Sem atividades neste filtro'}
          </p>
          <p className="text-sm mt-1">
            {nPassadas > 0
              ? 'Mostra-as com o botão "Mostrar passadas" em cima.'
              : pessoa.role === 'super_admin'
                ? 'Cria uma nova atividade para começar.'
                : 'A coordenação ainda não criou nada aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visiveis.map((a) => (
            <CartaoAtividade key={a.id} atividade={a} />
          ))}
        </div>
      )}
    </div>
  )
}
