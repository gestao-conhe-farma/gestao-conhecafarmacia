import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageSquareWarning } from 'lucide-react'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { obterSubtarefa } from '@/lib/dados'
import AcoesEstadoSubtarefa from './AcoesEstadoSubtarefa'
import AcoesDesconfirmarSubtarefa from './AcoesDesconfirmarSubtarefa'

export const metadata = { title: 'Detalhe da subtarefa' }

export default async function PaginaDetalheSubtarefa({ params }) {
  const { id } = await params
  const { pessoa } = await getUtilizadorAtual()
  const sub = await obterSubtarefa(id)
  if (!sub) notFound()

  const ehSuper = pessoa.role === 'super_admin'
  const souResponsavel = sub.subtarefa_responsaveis?.some((r) => r.pessoa_id === pessoa.id)
  const souCriador = sub.criado_por_id === pessoa.id
  const estadoAberto = ['aprovada', 'concluida', 'cancelada', 'erro'].includes(sub.status)

  const demonstraMotivosMembro =
    ehSuper || souResponsavel || souCriador ||
    sub.status === 'concluida' || sub.status === 'cancelada' || sub.status === 'erro'

  const motivosMembro = demonstraMotivosMembro
    ? (sub.subtarefa_estado_motivos ?? [])
        .filter((m) => ehSuper || m.pessoa_id === pessoa.id)
        .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
    : []

  // Desconfirmações de atribuição: RLS devolve as do próprio (ou todas
  // para super_admin).
  const desconfirmacoes = (sub.minhas_desconfirmacoes ?? []).filter(Boolean)
  const minhaDesconfirmacao = desconfirmacoes.find((d) => d.pessoa_id === pessoa.id)

  return (
    <div className="container-app max-w-3xl">
      <Link
        href={`/atividades/${sub.atividade_id}`}
        className="inline-flex items-center gap-2 text-sm text-brand-deep/55 hover:text-brand-primary mb-7 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar à atividade
      </Link>

      <header className="page-head">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="badge badge-tipo-subtarefa normal-case">Subtarefa</span>
          <span className={`badge ${classeStatus(sub.status)}`}>{rotuloStatus(sub.status)}</span>
        </div>

        <h1 className="text-2xl md:text-[30px] font-extrabold text-brand-deep leading-[1.15] tracking-tight">
          {sub.titulo}
        </h1>

        {sub.descricao && (
          <p className="text-brand-deep/70 mt-4 leading-relaxed max-w-2xl whitespace-pre-line">
            {sub.descricao}
          </p>
        )}
      </header>

      {/* Metadados */}
      <section className="card p-5 mb-6">
        <h2 className="text-sm font-bold text-brand-deep/60 uppercase tracking-wider mb-3">
          Informação da subtarefa
        </h2>
        <dl className="grid grid-cols-[160px_1fr] gap-y-3 gap-x-4 text-sm">
          <div>
            <dt className="text-brand-deep/50">Criada por</dt>
            <dd className="text-brand-deep font-semibold">{sub.criado_por?.nome ?? '—'}</dd>
          </div>
          {sub.prazo && (
            <div>
              <dt className="text-brand-deep/50">Prazo</dt>
              <dd className="text-brand-deep font-semibold">
                {new Date(sub.prazo).toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-brand-deep/50">Aprovada por</dt>
            <dd className="text-brand-deep font-semibold">
              {sub.aprovado_por?.nome
                ? `${sub.aprovado_por.nome} · ${new Date(sub.aprovado_em).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-brand-deep/50">Atividade associada</dt>
            <dd className="text-brand-deep font-semibold">
              <Link
                href={`/atividades/${sub.atividade_id}`}
                className="text-brand-accent hover:text-brand-primary underline underline-offset-2"
              >
                {sub.atividade?.titulo ?? '—'}
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      {/* Responsáveis */}
      {sub.subtarefa_responsaveis?.length > 0 && (
        <section className="card p-5 mb-6">
          <h2 className="text-sm font-bold text-brand-deep/60 uppercase tracking-wider mb-3">
            Responsáveis atribuídos
          </h2>
          <ul className="flex flex-wrap gap-2">
            {sub.subtarefa_responsaveis.map((r) => (
              <li
                key={r.pessoa_id}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-divider bg-brand-card px-3 py-1.5 text-sm text-brand-deep"
              >
                <span className="text-brand-accent font-semibold">{r.pessoas?.nome}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ações do responsável/criador: mudar estado (caixa de relatório) */}
      {estadoAberto && <AcoesEstadoSubtarefa sub={sub} pessoaAtualId={pessoa.id} />}

      {/* Recusar a própria atribuição (só responsáveis, subtarefa aberta) */}
      {estadoAberto && souResponsavel && (
        <section className="card p-5 mb-6">
          <h2 className="text-sm font-bold text-brand-deep/60 uppercase tracking-wider mb-3">
            Atribuição
          </h2>
          <p className="text-[13.5px] text-brand-deep/55 mb-4 leading-relaxed">
            Não consegues cumprir esta atribuição? Recusa-a com um justificativo —
            sais da lista de responsáveis e a coordenação fica a saber porquê.
          </p>
          <AcoesDesconfirmarSubtarefa sub={sub} pessoaAtualId={pessoa.id} />

          {minhaDesconfirmacao?.motivo && (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                A tua recusa registada
              </p>
              <p className="text-sm text-brand-deep/80 mt-0.5 whitespace-pre-line">
                {minhaDesconfirmacao.motivo}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Histórico de estados — caixas de relatório (autor + coordenação) */}
      {motivosMembro.length > 0 && (
        <section className="card p-5 mb-6">
          <h2 className="text-sm font-bold text-brand-deep/60 uppercase tracking-wider mb-3">
            Registos de estado {ehSuper ? '(todos os membros)' : '(teus)'}
          </h2>
          <ul className="space-y-3">
            {motivosMembro.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-brand-divider bg-brand-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`badge ${classeEstadoMotivo(m.estado_novo)}`}>
                    {rotuloEstadoMembro(m.estado_novo)}
                  </span>
                  <span className="text-xs text-brand-deep/50">
                    Registado por {m.pessoas?.nome ?? m.pessoa_id} ·{' '}
                    {new Date(m.criado_em).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-brand-deep/80 whitespace-pre-line leading-relaxed">
                  {m.motivo}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Desconfirmações de outros membros — só coordenação */}
      {ehSuper &&
        desconfirmacoes.filter((d) => d.pessoa_id !== pessoa.id).length > 0 && (
          <section className="card p-5 mb-6">
            <h2 className="text-sm font-bold text-brand-deep/60 uppercase tracking-wider mb-3">
              Recusas de atribuição · confidencial
            </h2>
            <ul className="space-y-3">
              {desconfirmacoes
                .filter((d) => d.pessoa_id !== pessoa.id)
                .map((d) => (
                  <li
                    key={d.pessoa_id}
                    className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] p-4"
                  >
                    <MessageSquareWarning size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-deep">
                        {d.pessoas?.nome ?? d.pessoa_id}
                        <span className="text-xs text-brand-deep/45 font-normal">
                          {' '}·{' '}
                          {new Date(d.criado_em).toLocaleString('pt-PT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                      <p className="text-sm text-brand-deep/80 mt-0.5 whitespace-pre-line">
                        {d.motivo}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        )}

      {/* Motivo da recusa da coordenação (só super_admin) */}
      {ehSuper && sub.status === 'rejeitada' && sub.motivo_recusa?.[0]?.motivo && (
        <section className="card p-5 mb-6 border-red-500/20">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 grid place-items-center shrink-0">
              <MessageSquareWarning size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                Motivo da recusa · confidencial
              </p>
              <p className="text-sm text-brand-deep/80 mt-1 whitespace-pre-line">
                {sub.motivo_recusa[0].motivo}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function classeStatus(status) {
  return {
    pendente_aprovacao: 'badge-status-pendente',
    aprovada: 'badge-status-aprovada',
    rejeitada: 'badge-status-rejeitada',
    concluida: 'badge-status-concluida',
    cancelada: 'badge-status-cancelada',
    erro: 'badge-status-erro',
  }[status] ?? 'badge-status-pendente'
}

function rotuloStatus(status) {
  return {
    pendente_aprovacao: 'Pendente',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
    erro: 'Erro',
  }[status] ?? status
}

function classeEstadoMotivo(estado) {
  return {
    concluida: 'badge-status-concluida',
    cancelada: 'badge-status-cancelada',
    erro: 'badge-status-erro',
  }[estado] ?? 'badge-status-pendente'
}

function rotuloEstadoMembro(estado) {
  return {
    concluida: 'Concluída',
    cancelada: 'Cancelada',
    erro: 'Erro',
  }[estado] ?? estado
}
