import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient, exigirUtilizador } from '@/lib/supabase/server'
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
import EditarDetalhes from './EditarDetalhes'
import ListaMateriais from './ListaMateriais'

export const metadata = { title: 'Atividade' }

export default async function PaginaAtividade({ params }) {
  const { id } = await params
  const { pessoa } = await exigirUtilizador()
  const atividade = await obterAtividade(id)
  if (!atividade) notFound()

  const supabase = await createClient()

  const [subtarefas, participantes, filhas, equipa, entidades, profissionais] = await Promise.all([
    listarSubtarefas({ atividadeId: id }),
    atividade.tipo === 'entrevista' ? listarParticipantes(id) : Promise.resolve([]),
    atividade.tipo === 'evento' ? listarAtividadesFilhas(id) : Promise.resolve([]),
    listarEquipa(),
    supabase.from('entidades').select('id, nome, tipo').eq('ativo', true).order('nome'),
    atividade.tipo === 'entrevista'
      ? supabase.from('profissionais').select('id, nome, profissao').eq('ativo', true).order('nome')
      : Promise.resolve({ data: [] }),
  ])

  const ehSuper = pessoa.role === 'super_admin'

  // Checklist nova (linhas) com fallback ao texto antigo (migration 0006)
  const itensMateriais = atividade.atividade_materiais ?? []
  const textoMateriais = itensMateriais.length
    ? itensMateriais.map((m) => m.nome).join('\n')
    : (atividade.materiais ?? '')
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
          {atividade.local && (
            <div className="min-w-0">
              <span className="meta-label">Local</span>
              <span className="text-sm font-semibold text-brand-deep break-words">
                {atividade.local}
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
          {atividade.orcamento != null && (
            <div>
              <span className="meta-label">Orçamento</span>
              <span className="text-sm font-semibold text-brand-deep">
                {atividade.orcamento.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} KZ
              </span>
            </div>
          )}
          {atividade.tipo === 'evento' && (atividade.publico_alvo || atividade.publico_esperado != null) && (
            <div className="min-w-0">
              <span className="meta-label">Público</span>
              <span className="text-sm font-semibold text-brand-deep">
                {atividade.publico_alvo || '—'}
                {atividade.publico_esperado != null && ` · esperados ${atividade.publico_esperado}`}
              </span>
            </div>
          )}
        </div>

        {/* Materiais (evento/atividade): checklist interativa com fallback ao texto antigo */}
        {(atividade.tipo === 'evento' || atividade.tipo === 'atividade') && itensMateriais.length > 0 && (
          <div className="mt-5 max-w-xl">
            <span className="meta-label">Materiais necessários</span>
            <ListaMateriais
              atividadeId={atividade.id}
              materiais={itensMateriais}
              pessoaAtualId={pessoa.id}
            />
          </div>
        )}
        {(atividade.tipo === 'evento' || atividade.tipo === 'atividade') && itensMateriais.length === 0 && atividade.materiais && (
          <div className="mt-5">
            <span className="meta-label">Materiais necessários</span>
            <ul className="mt-1 flex flex-wrap gap-2">
              {atividade.materiais.split('\n').map((m, i) => (
                m.trim() ? (
                  <li
                    key={i}
                    className="text-[13px] font-medium text-brand-deep/75 bg-brand-bg-alt border border-brand-divider rounded-lg px-2.5 py-1"
                  >
                    {m.trim()}
                  </li>
                ) : null
              ))}
            </ul>
          </div>
        )}

        {/* Entidades ligadas: parceiros e patrocinadores */}
        {atividade.atividade_entidades?.length > 0 && (
          <div className="mt-5">
            <span className="meta-label">Entidades</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {atividade.atividade_entidades.map((l) =>
                l.entidades ? (
                  <Link
                    key={l.entidade_id}
                    href="/entidades"
                    className="text-[13px] font-medium text-brand-deep/75 bg-brand-bg-alt border border-brand-divider rounded-lg px-2.5 py-1 hover:border-brand-primary/40 transition-colors"
                  >
                    {l.entidades.nome}
                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                      {l.papel}
                    </span>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Profissional externo entrevistado */}
        {atividade.tipo === 'entrevista' && atividade.atividade_profissionais?.length > 0 && (
          <div className="mt-5">
            <span className="meta-label">Profissional convidado</span>
            <div className="mt-1">
              {atividade.atividade_profissionais.map((l) =>
                l.profissionais ? (
                  <p key={l.profissional_id} className="text-sm font-semibold text-brand-deep">
                    {l.profissionais.nome}
                    {l.profissionais.profissao && (
                      <span className="font-normal text-brand-deep/55"> · {l.profissionais.profissao}</span>
                    )}
                    {l.profissionais.instituicao && (
                      <span className="font-normal text-brand-deep/45"> · {l.profissionais.instituicao}</span>
                    )}
                  </p>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Editar detalhes: coordenação */}
        {ehSuper && (
          <div className="mt-6">
            <EditarDetalhes
              atividade={{
                id: atividade.id,
                titulo: atividade.titulo,
                descricao: atividade.descricao,
                prazo: atividade.prazo,
                local: atividade.local,
                materiais: textoMateriais,
                orcamento: atividade.orcamento,
                publico_alvo: atividade.publico_alvo,
                publico_esperado: atividade.publico_esperado,
                tipo: atividade.tipo,
                ligacoesEntidades: (atividade.atividade_entidades ?? []).map((l) => ({
                  entidade_id: l.entidade_id,
                  papel: l.papel,
                })),
                profissionalId: atividade.atividade_profissionais?.[0]?.profissional_id ?? null,
              }}
              entidades={entidades.data ?? []}
              profissionais={profissionais.data ?? []}
            />
          </div>
        )}
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
          esperado={atividade.publico_esperado}
          real={atividade.publico_real}
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
              equipa={equipa}
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
