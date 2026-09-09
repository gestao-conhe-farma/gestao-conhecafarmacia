import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Clock, Users } from 'lucide-react'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import {
  obterAtividade,
  listarSubtarefas,
  listarParticipantes,
  listarAtividadesFilhas,
  listarEquipa,
  formatarData,
} from '@/lib/dados'
import ListaSubtarefas from './ListaSubtarefas'
import SecaoEntrevista from './SecaoEntrevista'
import PainelEvento from './PainelEvento'

export const metadata = { title: 'Atividade' }

export default async function PaginaAtividade({ params }) {
  const { id } = await params
  const { pessoa } = await getUtilizadorAtual()
  const atividade = await obterAtividade(id)
  if (!atividade) notFound()

  const [subtarefas, participantes, filhas, equipa] = await Promise.all([
    listarSubtarefas({ atividadeId: id }),
    atividade.tipo === 'entrevista' ? listarParticipantes(id) : Promise.resolve([]),
    atividade.tipo === 'evento' ? listarAtividadesFilhas(id) : Promise.resolve([]),
    listarEquipa(),
  ])

  const ehSuper = pessoa.role === 'super_admin'
  const meuConvite = participantes.find((p) => p.pessoa_id === pessoa.id)
  const confirmadas = participantes.filter((p) => p.status === 'confirmado').length

  return (
    <div className="container-app max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-brand-deep/60 hover:text-brand-primary mb-6"
      >
        <ArrowLeft size={15} />
        Voltar ao início
      </Link>

      {/* Cabeçalho */}
      <div className="card p-6 md:p-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`badge ${classeTipo(atividade.tipo)}`}>{rotuloTipo(atividade.tipo)}</span>
          {atividade.tipo === 'evento' && atividade.status_evento && (
            <span className="badge badge-status-pendente normal-case">
              {rotuloEvento(atividade.status_evento)}
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-deep leading-tight">
          {atividade.titulo}
        </h1>
        {atividade.descricao && (
          <p className="text-brand-deep/70 mt-3 leading-relaxed whitespace-pre-line">
            {atividade.descricao}
          </p>
        )}

        <div className="mt-5 pt-5 border-t border-brand-divider/60 flex flex-wrap gap-x-8 gap-y-2 text-sm text-brand-deep/60">
          {atividade.prazo && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} className="text-brand-accent" />
              Prazo: {formatarData(atividade.prazo)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Users size={15} className="text-brand-accent" />
            Responsáveis:{' '}
            <strong className="text-brand-deep">
              {atividade.atividade_responsaveis?.map((r) => r.pessoas?.nome).join(', ') ||
                '—'}
            </strong>
          </span>
          <span>
            Criada por <strong className="text-brand-deep">{atividade.criado_por?.nome}</strong>
          </span>
        </div>
      </div>

      {/* Entrevista */}
      {atividade.tipo === 'entrevista' && (
        <SecaoEntrevista
          atividadeId={id}
          participantes={participantes}
          ehSuper={ehSuper}
          meuConvite={meuConvite ?? null}
          equipa={equipa}
          confirmadas={confirmadas}
        />
      )}

      {/* Evento: estado + atividades subordinadas */}
      {atividade.tipo === 'evento' && (
        <PainelEvento
          atividadeId={id}
          status={atividade.status_evento}
          ehSuper={ehSuper}
          filhas={filhas}
        />
      )}

      {/* Subtarefas */}
      <div className="card p-6 md:p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-brand-deep">
            Subtarefas
          </h2>
          <span className="text-sm text-brand-deep/50">
            {subtarefas.filter((s) => s.status === 'concluida').length}/{subtarefas.length} concluídas
          </span>
        </div>
        <ListaSubtarefas
          atividadeId={id}
          subtarefas={subtarefas}
          ehSuper={ehSuper}
          pessoaAtualId={pessoa.id}
        />
      </div>

      {/* Criar subtarefa (dentro desta atividade) */}
      <div className="card p-6 md:p-8">
        <h2 className="font-display text-xl font-bold text-brand-deep mb-1">
          Nova subtarefa
        </h2>
        <p className="text-sm text-brand-deep/55 mb-6">
          Subtarefas criadas por membros passam por aprovação da coordenação antes
          de ficarem visíveis.
        </p>
        <FormSubtarefaInline atividadeId={id} equipa={equipa} />
      </div>
    </div>
  )
}

function classeTipo(tipo) {
  return { atividade: 'badge-tipo-atividade', evento: 'badge-tipo-evento', entrevista: 'badge-tipo-entrevista' }[tipo]
}
function rotuloTipo(tipo) {
  return { atividade: 'Atividade', evento: 'Evento', entrevista: 'Entrevista' }[tipo]
}
function rotuloEvento(s) {
  return { planeada: 'Planeada', em_andamento: 'Em andamento', concluida: 'Concluída' }[s] ?? s
}
