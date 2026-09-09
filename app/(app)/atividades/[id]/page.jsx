import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
import FormSubtarefaInline from './FormSubtarefaInline'
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

  // Numeração editorial das secções — a entrevista/evento conta como 01
  const temSecaoExtra = atividade.tipo === 'entrevista' || atividade.tipo === 'evento'
  const numSubtarefas = temSecaoExtra ? '02' : '01'
  const numNova = temSecaoExtra ? '03' : '02'

  return (
    <div className="container-app max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-brand-deep/55 hover:text-brand-primary mb-7 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar ao início
      </Link>

      {/* Cabeçalho editorial: sem cartão, régua forte */}
      <header className="page-head">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`badge ${classeTipo(atividade.tipo)}`}>{rotuloTipo(atividade.tipo)}</span>
          {atividade.tipo === 'evento' && atividade.status_evento && (
            <span className="badge badge-status-pendente normal-case">
              {rotuloEvento(atividade.status_evento)}
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-[34px] font-extrabold text-brand-deep leading-[1.15] tracking-tight">
          {atividade.titulo}
        </h1>

        {atividade.descricao && (
          <p className="text-brand-deep/65 mt-4 leading-relaxed max-w-2xl whitespace-pre-line">
            {atividade.descricao}
          </p>
        )}

        {/* Meta strip com etiquetas */}
        <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
          {atividade.prazo && (
            <div>
              <span className="meta-label">Prazo</span>
              <span className="text-sm font-semibold text-brand-deep">
                {formatarData(atividade.prazo)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <span className="meta-label">Responsáveis</span>
            <span className="text-sm font-semibold text-brand-deep">
              {atividade.atividade_responsaveis?.map((r) => r.pessoas?.nome).join(', ') || '—'}
            </span>
          </div>
          <div>
            <span className="meta-label">Criada por</span>
            <span className="text-sm font-semibold text-brand-deep">
              {atividade.criado_por?.nome}
            </span>
          </div>
        </div>
      </header>

      {/* Entrevista */}
      {atividade.tipo === 'entrevista' && (
        <SecaoEntrevista
          atividadeId={id}
          participantes={participantes}
          ehSuper={ehSuper}
          meuConvite={meuConvite ?? null}
          equipa={equipa}
          confirmadas={confirmadas}
          num="01"
        />
      )}

      {/* Evento: estado + atividades subordinadas */}
      {atividade.tipo === 'evento' && (
        <PainelEvento
          atividadeId={id}
          status={atividade.status_evento}
          ehSuper={ehSuper}
          filhas={filhas}
          num="01"
        />
      )}

      {/* Secções numeradas */}
      <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
        <span className="sec-num">{numSubtarefas}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-brand-deep tracking-tight">Subtarefas</h2>
            <span className="text-sm text-brand-deep/45 tabular-nums">
              <strong className="text-brand-deep">
                {subtarefas.filter((s) => s.status === 'concluida').length}
              </strong>
              /{subtarefas.length} concluídas
            </span>
          </div>
          <div className="mt-4">
            <ListaSubtarefas
              atividadeId={id}
              subtarefas={subtarefas}
              ehSuper={ehSuper}
              pessoaAtualId={pessoa.id}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
        <span className="sec-num">{numNova}</span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">Nova subtarefa</h2>
          <p className="text-[13.5px] text-brand-deep/55 mt-1 leading-relaxed max-w-xl">
            Subtarefas criadas por membros passam por aprovação da coordenação
            antes de ficarem visíveis.
          </p>
          <div className="mt-5">
            <FormSubtarefaInline atividadeId={id} equipa={equipa} />
          </div>
        </div>
      </section>
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
