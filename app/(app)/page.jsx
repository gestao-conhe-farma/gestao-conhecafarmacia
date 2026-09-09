import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock, ListTodo, Plus, UserCheck } from 'lucide-react'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { listarAtividades, listarSubtarefas, formatarData } from '@/lib/dados'
import CartaoAtividade from './CartaoAtividade'
import AbasTipo from './AbasTipo'

export const metadata = { title: 'Início' }

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
      {/* Cabeçalho editorial com régua forte */}
      <div className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Painel</p>
            <h1 className="text-3xl md:text-[40px] font-extrabold text-brand-deep mt-2 leading-[1.05]">
              Olá, {pessoa.nome.split(' ')[0]}
            </h1>
            <p className="text-brand-deep/60 mt-2.5 max-w-xl">
              {pessoa.role === 'super_admin'
                ? 'Resumo do estado da organização: o que está aprovado, o que aguarda decisão e o que está em curso.'
                : 'Aqui está o que está aprovado e em curso na equipa.'}
            </p>
          </div>
          {pessoa.role === 'super_admin' && (
            <Link href="/atividades/nova" className="btn btn-primary">
              <Plus size={16} />
              Nova atividade
            </Link>
          )}
        </div>
      </div>

      {/* Banda KPI com réguas verticais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-brand-divider">
        {stats.map(({ label, valor, icon: Icon }, i) => (
          <div
            key={label}
            className={`py-7 ${i > 0 ? 'lg:pl-7 pl-5 lg:border-l border-brand-divider' : ''} ${
              i % 2 === 1 ? 'border-l lg:border-l' : ''
            } ${i < 2 ? 'border-b lg:border-b-0 border-brand-divider' : ''}`}
          >
            <p className="text-[10.5px] tracking-[0.16em] uppercase font-bold text-brand-deep/40 flex items-center gap-2">
              <Icon size={13} className="text-brand-accent" />
              {label}
            </p>
            <p className="text-[40px] font-extrabold text-brand-deep leading-none mt-2.5 tabular-nums tracking-tight">
              {valor}
            </p>
          </div>
        ))}
      </div>

      {/* Secção: lista editorial */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-9 mb-4">
        <h2 className="text-lg font-bold text-brand-deep">
          <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">01</span>
          O que está a acontecer
        </h2>
        <AbasTipo atual={tipo} />
      </div>

      {atividades.length === 0 ? (
        <div className="card empty-state border-dashed">
          <CheckCircle2 size={34} className="mx-auto mb-3 text-brand-accent/50" />
          <p className="font-semibold text-brand-deep">Nada por aqui ainda</p>
          <p className="text-sm mt-1">
            {pessoa.role === 'super_admin'
              ? 'Cria a primeira atividade para começar.'
              : 'Assim que a coordenação aprovar conteúdo, aparece aqui.'}
          </p>
        </div>
      ) : (
        <div className="border-t border-brand-divider">
          {atividades.map((a) => (
            <CartaoAtividade key={a.id} atividade={a} />
          ))}
        </div>
      )}

      {/* Painel lateral de tarefas */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-brand-deep">
              <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">02</span>
              Tarefas aprovadas
            </h3>
            {pessoa.role === 'super_admin' && aAprovar.length > 0 && (
              <Link href="/aprovacoes" className="badge badge-status-pendente normal-case">
                {aAprovar.length} à espera de aprovação
              </Link>
            )}
          </div>
          {subtarefasVisiveis.length === 0 ? (
            <p className="text-sm text-brand-deep/50 py-8 text-center">
              Sem tarefas aprovadas de momento.
            </p>
          ) : (
            <ul className="divide-y divide-brand-divider/70">
              {subtarefasVisiveis.slice(0, 8).map((s) => (
                <li key={s.id} className="py-3.5 flex items-center gap-3">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      s.status === 'concluida' ? 'bg-brand-accent' : 'bg-amber-500'
                    }`}
                    aria-hidden="true"
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

        {/* Em atraso / pendências */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-brand-deep mb-2">
            <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">03</span>
            Em atraso
          </h3>
          {emAtraso.length === 0 ? (
            <p className="text-sm text-brand-deep/50 py-8 text-center">
              Nada em atraso. Bom trabalho.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {emAtraso.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" aria-hidden="true" />
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
            <div className="mt-6 pt-5 border-t border-brand-divider/70">
              <h4 className="text-sm font-bold text-brand-deep mb-2.5">Aprovações pendentes</h4>
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
