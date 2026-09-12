import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock, ListTodo, Plus, UserCheck } from 'lucide-react'
import { exigirUtilizador } from '@/lib/supabase/server'
import {
  listarAtividades,
  listarSubtarefas,
  listarDatasFuturas,
  listarPlanosSemAtividade,
  formatarData,
} from '@/lib/dados'
import CartaoAtividade from './CartaoAtividade'
import AbasTipo from './AbasTipo'
import CalendarioPrazos from './CalendarioPrazos'

export const metadata = { title: 'Início' }

const ROTULO_STATUS = {
  aprovada: { label: 'Aprovada', cls: 'badge-status-aprovada' },
  concluida: { label: 'Concluída', cls: 'badge-status-concluida' },
  cancelada: { label: 'Cancelada', cls: 'badge-status-cancelada' },
  erro: { label: 'Erro', cls: 'badge-status-erro' },
}

export default async function PaginaInicio({ searchParams }) {
  const { pessoa } = await exigirUtilizador()
  const params = await searchParams
  const tipo = params?.tipo || 'todas'

  const [atividades, minhasSubtarefas, aAprovar, datasFuturas, planosPendentes] = await Promise.all([
    listarAtividades({ tipo }),
    listarSubtarefas({}),
    pessoa.role === 'super_admin'
      ? listarSubtarefas({ status: 'pendente_aprovacao' })
      : Promise.resolve([]),
    listarDatasFuturas(),
    listarPlanosSemAtividade(),
  ])

  // Decisões aprovadas sem atividade, com a idade da decisão —
  // as mais antigas primeiro (são as que morrem esquecidas)
  const decisoesAbertas = planosPendentes
    .map((p) => ({
      ...p,
      dias: Math.floor(
        (Date.now() - new Date(p.decidido_em ?? p.criado_em).getTime()) / 86400000
      ),
    }))
    .sort((a, b) => b.dias - a.dias)

  const subtarefasVisiveis = minhasSubtarefas.filter((s) =>
    ['aprovada', 'concluida', 'cancelada', 'erro'].includes(s.status)
  )
  const emAtraso = subtarefasVisiveis.filter(
    (s) =>
      !['concluida', 'cancelada', 'erro'].includes(s.status) &&
      s.prazo &&
      new Date(s.prazo) < new Date()
  )

  // Eventos para o calendário de prazos: atividades, subtarefas com prazo
  // e reuniões agendadas. Subtarefas pendentes de aprovação não contam —
  // ainda não são compromisso.
  const eventosCalendario = [
    ...datasFuturas.atividades.map((a) => ({
      id: `a-${a.id}`,
      titulo: a.titulo,
      tipo: a.tipo,
      prazo: a.prazo,
      status: a.tipo === 'evento' && a.status_evento === 'concluida' ? 'concluida' : 'aberta',
      href: `/atividades/${a.id}`,
    })),
    ...datasFuturas.subtarefas
      .filter((s) => s.status !== 'pendente_aprovacao')
      .map((s) => ({
        id: `s-${s.id}`,
        titulo: s.titulo,
        tipo: 'subtarefa',
        prazo: s.prazo,
        status: s.status,
        href: `/atividades/${s.atividade_id}`,
      })),
    ...datasFuturas.reunioes.map((r) => ({
      id: `r-${r.id}`,
      titulo: r.titulo,
      tipo: 'reuniao',
      prazo: r.data_hora,
      status: 'aberta',
      href: `/reunioes/${r.id}`,
    })),
  ]

  const stats = [
    { label: 'Atividades', valor: atividades.filter((a) => a.tipo === 'atividade').length, icon: ListTodo },
    { label: 'Eventos', valor: atividades.filter((a) => a.tipo === 'evento').length, icon: CalendarDays },
    { label: 'Entrevistas', valor: atividades.filter((a) => a.tipo === 'entrevista').length, icon: UserCheck },
    { label: 'Tarefas em curso', valor: subtarefasVisiveis.filter((s) => s.status === 'aprovada').length, icon: Clock },
  ]

  // Reunião em destaque: só aparece quando há reunião agendada na semana
  // atual (segunda a domingo). A mais próxima da semana entra em cena.
  const agora = new Date()
  const segundaFeira = new Date(agora)
  segundaFeira.setDate(agora.getDate() - ((agora.getDay() + 6) % 7))
  segundaFeira.setHours(0, 0, 0, 0)
  const domingo = new Date(segundaFeira)
  domingo.setDate(segundaFeira.getDate() + 6)
  domingo.setHours(23, 59, 59, 999)

  const reuniaoDaSemana = datasFuturas.reunioes
    .filter((r) => {
      const d = new Date(r.data_hora)
      return d >= segundaFeira && d <= domingo
    })
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))[0]

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

      {/* Destaque: reunião desta semana (só na semana da reunião) */}
      {reuniaoDaSemana && <DestaqueReuniao reuniao={reuniaoDaSemana} />}

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
                      s.status === 'concluida'
                        ? 'bg-brand-accent'
                        : s.status === 'erro'
                        ? 'bg-red-600'
                        : s.status === 'cancelada'
                        ? 'bg-slate-500'
                        : 'bg-amber-500'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold text-brand-deep truncate ${s.status === 'concluida' ? 'line-through opacity-60' : ''}`}>
                      {s.titulo}
                    </p>
                    <p className="text-xs text-brand-deep/50">
                      {s.subtarefa_responsaveis?.map((r) => r.pessoas?.nome).join(', ') ||
                        'Sem responsável'}
                      {s.prazo && ` · prazo ${formatarData(s.prazo)}`}
                    </p>
                  </div>
                  <span className={`badge ${ROTULO_STATUS[s.status]?.cls ?? 'badge-status-aprovada'}`}>
                    {ROTULO_STATUS[s.status]?.label ?? s.status}
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

        {/* Decisões aprovadas que ainda não viraram atividade — o ciclo
            reunião → ação fechado à vista de toda a equipa */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-brand-deep">
              <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">03</span>
              Decisões à espera
            </h3>
            {decisoesAbertas.length > 0 && (
              <span className="badge badge-status-pendente normal-case">
                {decisoesAbertas.length}
              </span>
            )}
          </div>
          {decisoesAbertas.length === 0 ? (
            <p className="text-sm text-brand-deep/50 py-8 text-center">
              Toda a decisão aprovada já tem atividade. Boa.
            </p>
          ) : (
            <ul className="divide-y divide-brand-divider/70">
              {decisoesAbertas.slice(0, 6).map((p) => (
                <li key={p.id} className="py-3.5 flex items-center gap-3">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      p.dias >= 30 ? 'bg-red-600' : p.dias >= 14 ? 'bg-amber-500' : 'bg-brand-accent'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-deep truncate">
                      {p.titulo}
                    </p>
                    <p className="text-xs text-brand-deep/50">
                      {p.reuniao?.titulo} · há {p.dias} dia{p.dias === 1 ? '' : 's'}
                      {p.prazo && ` · alvo ${formatarData(p.prazo)}`}
                    </p>
                  </div>
                  <Link
                    href={`/reunioes/${p.reuniao?.id}`}
                    className="text-[11.5px] font-semibold text-brand-accent hover:underline shrink-0"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Calendário de prazos (secção 04) */}
      <div className="mt-6">
        <CalendarioPrazos eventos={eventosCalendario} largo />
      </div>
    </div>
  )
}

/** Banda editorial com a reunião desta semana — verde, com data/hora/local. */
function DestaqueReuniao({ reuniao }) {
  const data = new Date(reuniao.data_hora)
  const quando = data.toLocaleString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
  const dia = data.getDate().toString().padStart(2, '0')
  const mes = data.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '')
  const urgente = reuniao.tipo === 'urgente'

  return (
    <Link
      href={`/reunioes/${reuniao.id}`}
      className="group block mt-6 border-y border-brand-accent/30 bg-brand-accent/[0.06] hover:bg-brand-accent/[0.09] transition-colors"
    >
      <div className="flex items-center gap-5 py-5">
        {/* Data em destaque */}
        <div className="shrink-0 text-center px-1">
          <p className="text-[30px] leading-none font-extrabold text-brand-deep tabular-nums">
            {dia}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent mt-1">
            {mes}
          </p>
        </div>

        <div className="w-px self-stretch bg-brand-accent/25" aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-brand-accent flex items-center gap-2">
            Reunião esta semana
          </p>
          <p className="text-[15px] font-bold text-brand-deep mt-1 truncate group-hover:text-brand-primary transition-colors">
            {reuniao.titulo}
          </p>
          <p className="text-sm text-brand-deep/60 mt-0.5 capitalize">
            {quando}
            {reuniao.local && ` · ${reuniao.local}`}
          </p>
        </div>

        <span
          className={`badge shrink-0 ${
            urgente ? 'bg-amber-500/10 text-amber-600' : 'bg-brand-accent/10 text-brand-accent'
          }`}
        >
          {urgente ? 'Urgente' : 'Mensal'}
        </span>
      </div>
    </Link>
  )
}
