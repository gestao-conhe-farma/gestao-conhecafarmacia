import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock, ListTodo, Plus, UserCheck } from 'lucide-react'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { listarAtividades, listarSubtarefas, formatarData } from '@/lib/dados'
import CartaoAtividade from './CartaoAtividade'
import AbasTipo from './AbasTipo'

export const metadata = { title: 'Início' }

const ROTULOS_TIPO = {
  atividade: 'Atividade',
  evento: 'Evento',
  entrevista: 'Entrevista',
}

export default async function PaginaInicio({ searchParams }) {
  const { pessoa } = await getUtilizadorAtual()
  const params = await searchParams
  const tipo = params?.tipo || 'todas'

  const [atividades, minhasSubtarefas, aAprovar] = await Promise.all([
    listarAtividades({ tipo }),
    listarSubtarefas({}),
    pessoa.role === 'super_admin'
      ? listarSubtarefas({ status: 'pendente_aprovacao' })
      : Promise.resolve([]),
  ])

  // Subtarefas aprovadas/concluídas (visíveis a todos) — painel lateral
  const subtarefasVisiveis = minhasSubtarefas.filter((s) =>
    ['aprovada', 'concluida'].includes(s.status)
  )
  const emAtraso = subtarefasVisiveis.filter(
    (s) => s.status !== 'concluida' && s.prazo && new Date(s.prazo) < new Date()
  )

  const stats = [
    { label: 'Atividades', valor: atividades.filter((a) => a.tipo === 'atividade').length, icon: ListTodo },
    { label: 'Eventos', valor: atividades.filter((a) => a.tipo === 'evento').length, icon: CalendarDays },
    { label: 'Entrevistas', valor: atividades.filter((a) => a.tipo === 'entrevista').length, icon: UserCheck },
    { label: 'Tarefas em curso', valor: subtarefasVisiveis.filter((s) => s.status === 'aprovada').length, icon: Clock },
  ]

  return (
    <div className="container-app">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-accent">
            Conheça Farmácia · Gestão
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-deep mt-1">
            Olá, {pessoa.nome.split(' ')[0]} 👋
          </h1>
          <p className="text-brand-deep/60 mt-1">
            {pessoa.role === 'super_admin'
              ? 'Tens acesso de coordenação — podes criar e aprovar.'
              : 'Aqui está o que está aprovado e em curso.'}
          </p>
        </div>
        {pessoa.role === 'super_admin' && (
          <Link href="/atividades/nova" className="btn btn-primary">
            <Plus size={16} />
            Nova atividade
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, valor, icon: Icon }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <span className="w-11 h-11 rounded-[14px] grid place-items-center bg-gradient-to-br from-[#e8f7ef] to-[#d5efe1] text-brand-accent">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-brand-deep leading-none">{valor}</p>
              <p className="text-xs text-brand-deep/55 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h2 className="font-display text-xl font-bold text-brand-deep mr-3">
          O que está a acontecer
        </h2>
        <div className="flex flex-wrap gap-2 ml-auto">
          <AbasTipo atual={tipo} />
        </div>
      </div>

      {/* Lista principal */}
      {atividades.length === 0 ? (
        <div className="card empty-state">
          <CheckCircle2 size={36} className="mx-auto mb-3 text-brand-accent/50" />
          <p className="font-semibold text-brand-deep">Nada por aqui ainda</p>
          <p className="text-sm mt-1">
            {pessoa.role === 'super_admin'
              ? 'Cria a primeira atividade para começar.'
              : 'Assim que a coordenação aprovar conteúdo, aparece aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {atividades.map((a) => (
            <CartaoAtividade key={a.id} atividade={a} />
          ))}
        </div>
      )}

      {/* Painel de subtarefas */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-brand-deep">
              Tarefas aprovadas
            </h3>
            {pessoa.role === 'super_admin' && aAprovar.length > 0 && (
              <Link
                href="/aprovacoes"
                className="badge badge-status-pendente normal-case"
              >
                {aAprovar.length} à espera de aprovação →
              </Link>
            )}
          </div>
          {subtarefasVisiveis.length === 0 ? (
            <p className="text-sm text-brand-deep/50 py-6 text-center">
              Sem tarefas aprovadas de momento.
            </p>
          ) : (
            <ul className="divide-y divide-brand-divider/60">
              {subtarefasVisiveis.slice(0, 8).map((s) => (
                <li key={s.id} className="py-3 flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      s.status === 'concluida' ? 'bg-brand-accent' : 'bg-amber-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-deep truncate">
                      {s.titulo}
                    </p>
                    <p className="text-xs text-brand-deep/50">
                      {s.subtarefa_responsaveis?.map((r) => r.pessoas?.nome).join(', ') ||
                        'Sem responsável'}
                      {s.prazo && ` · prazo ${formatarData(s.prazo)}`}
                    </p>
                  </div>
                  <span className={`badge ${s.status === 'concluida' ? 'badge-status-concluida' : 'badge-status-aprovada'}`}>
                    {s.status === 'concluida' ? 'Concluída' : 'Aprovada'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Em atraso / pendentes */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-bold text-brand-deep mb-4">
            Em atraso
          </h3>
          {emAtraso.length === 0 ? (
            <p className="text-sm text-brand-deep/50 py-6 text-center">
              Nada em atraso. Bom trabalho! 🎉
            </p>
          ) : (
            <ul className="space-y-3">
              {emAtraso.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-brand-deep">{s.titulo}</p>
                    <p className="text-xs text-red-500/90">
                      prazo {formatarData(s.prazo)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {pessoa.role === 'super_admin' && aAprovar.length > 0 && (
            <div className="mt-6 pt-5 border-t border-brand-divider/60">
              <h4 className="text-sm font-bold text-brand-deep mb-2">
                Aprovações pendentes
              </h4>
              <Link href="/aprovacoes" className="btn btn-accent btn-small w-full">
                <ListTodo size={14} />
                Rever {aAprovar.length} tarefa{aAprovar.length > 1 ? 's' : ''}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
