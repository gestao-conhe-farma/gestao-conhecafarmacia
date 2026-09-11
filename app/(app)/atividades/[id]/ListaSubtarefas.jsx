'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, Loader2, Pencil, RotateCcw, Trash2, X, CheckCircle2, MessageSquareWarning, UserX } from 'lucide-react'
import {
  aprovarSubtarefa,
  rejeitarSubtarefa,
  mudarEstadoSubtarefa,
  eliminarSubtarefa,
  retratarRecusaSubtarefa,
  desconfirmarAtribuicaoSubtarefa,
} from '../subtarefas-actions'
import FormSubtarefaInline from './FormSubtarefaInline'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

const ROTULOS = {
  pendente_aprovacao: { label: 'Pendente', cls: 'badge-status-pendente', dot: 'bg-amber-500' },
  aprovada: { label: 'Aprovada', cls: 'badge-status-aprovada', dot: 'bg-brand-accent' },
  rejeitada: { label: 'Rejeitada', cls: 'badge-status-rejeitada', dot: 'bg-red-500' },
  concluida: { label: 'Concluída', cls: 'badge-status-concluida', dot: 'bg-brand-primary' },
  cancelada: { label: 'Cancelada', cls: 'badge-status-cancelada', dot: 'bg-slate-500' },
  erro: { label: 'Erro', cls: 'badge-status-erro', dot: 'bg-red-600' },
}

const ESTADOS_ABERTOS = ['aprovada', 'concluida', 'cancelada', 'erro']

export default function ListaSubtarefas({ atividadeId, subtarefas, equipa = [], ehSuper, pessoaAtualId }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)
  const [emEdicao, setEmEdicao] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [erroRecusa, setErroRecusa] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  // Mudança de estado pelo responsável/criador (caixa de relatório)
  const [motivoEstado, setMotivoEstado] = useState('')
  const [erroEstado, setErroEstado] = useState(null)
  const [pedirConfirmacaoEstado, caixaConfirmacaoEstado] = useConfirmacao()

  // Recusa da própria atribuição (desconfirmação)
  const [motivoDesconf, setMotivoDesconf] = useState('')
  const [erroDesconf, setErroDesconf] = useState(null)
  const [pedirDesconf, caixaDesconf] = useConfirmacao()

  async function executar(fn, id) {
    setAProcessar(id)
    try {
      await fn(id)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  function pedirEliminar(s) {
    return pedirConfirmacao({
      titulo: `Eliminar “${s.titulo}”?`,
      descricao:
        'A subtarefa desaparece com os seus responsáveis e histórico. Esta ação não pode ser anulada.',
      confirmarTxt: 'Eliminar',
      perigoso: true,
    }).then(async (ok) => {
      if (!ok) return
      await executar(eliminarSubtarefa, s.id)
    })
  }

  function pedirRecusar(s) {
    // Caixa de texto obrigatória: o motivo fica guardado mas só a
    // coordenação (super_admin) o pode ler — RLS na tabela subtarefa_recusas.
    setMotivo('')
    setErroRecusa(null)
    return pedirConfirmacao({
      titulo: `Recusar “${s.titulo}”?`,
      descricao: 'O criador verá que a tarefa foi recusada, mas o motivo fica visível apenas para a coordenação.',
      confirmarTxt: 'Recusar tarefa',
      perigoso: true,
      extra: (
        <div className="mt-1">
          <label className="form-label">Motivo da recusa (obrigatório)</label>
          <textarea
            className="form-textarea"
            rows={3}
            autoFocus
            placeholder="Ex.: fora do âmbito desta atividade; já coberta pela tarefa X…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          {erroRecusa && (
            <p className="text-sm text-red-600 mt-2">{erroRecusa}</p>
          )}
        </div>
      ),
    }).then(async (ok) => {
      if (!ok) return
      const texto = motivo.trim()
      if (!texto) {
        setErroRecusa('Explica o motivo da recusa — é obrigatório.')
        return
      }
      setAProcessar(s.id)
      try {
        const r = await rejeitarSubtarefa(s.id, texto)
        if (!r.ok) {
          setErroRecusa(r.erro)
          return
        }
        setMotivo('')
        setErroRecusa(null)
        router.refresh()
      } finally {
        setAProcessar(null)
      }
    })
  }

  function abrirMudancaEstado(s, estado) {
    setMotivoEstado('')
    setErroEstado(null)
    return pedirConfirmacaoEstado({
      titulo: `Mudar o estado de “${s.titulo}” para ${ROTULOS[estado]?.label ?? estado}?`,
      descricao: 'Preenche a caixa de relatório — só tu e a coordenação a vêem.',
      confirmarTxt: 'Guardar mudança',
      perigoso: estado === 'cancelada' || estado === 'erro',
      extra: (
        <div className="mt-2">
          <label className="form-label">Relatório (obrigatório)</label>
          <textarea
            className="form-textarea"
            rows={3}
            autoFocus
            placeholder={PLACEHOLDERS_ESTADO[estado]}
            value={motivoEstado}
            onChange={(e) => setMotivoEstado(e.target.value)}
          />
          {erroEstado && (
            <p className="text-sm text-red-600 mt-2">{erroEstado}</p>
          )}
        </div>
      ),
    }).then(async (ok) => {
      if (!ok) return
      if (!motivoEstado.trim()) {
        setErroEstado('O relatório é obrigatório.')
        return
      }
      setAProcessar(s.id)
      try {
        const r = await mudarEstadoSubtarefa(s.id, estado, motivoEstado)
        if (!r.ok) {
          setErroEstado(r.erro)
          return
        }
        setMotivoEstado('')
        setErroEstado(null)
        router.refresh()
      } finally {
        setAProcessar(null)
      }
    })
  }

  function pedirDesconfirmarAtribuicao(s) {
    setMotivoDesconf('')
    setErroDesconf(null)
    return pedirDesconf({
      titulo: `Recusar a tua atribuição a “${s.titulo}”?`,
      descricao:
        'Sais da lista de responsáveis desta subtarefa. O justificativo fica registado — só tu e a coordenação o vêem.',
      confirmarTxt: 'Recusar atribuição',
      perigoso: true,
      extra: (
        <div className="mt-2">
          <label className="form-label">Justificativa (obrigatório)</label>
          <textarea
            className="form-textarea"
            rows={3}
            autoFocus
            placeholder="Ex.: não tenho disponibilidade nesta semana; sobreponho com outra tarefa…"
            value={motivoDesconf}
            onChange={(e) => setMotivoDesconf(e.target.value)}
          />
          {erroDesconf && (
            <p className="text-sm text-red-600 mt-2">{erroDesconf}</p>
          )}
        </div>
      ),
    }).then(async (ok) => {
      if (!ok) return
      if (!motivoDesconf.trim()) {
        setErroDesconf('O justificativo é obrigatório.')
        return
      }
      setAProcessar(s.id)
      try {
        const r = await desconfirmarAtribuicaoSubtarefa(s.id, motivoDesconf)
        if (!r.ok) {
          setErroDesconf(r.erro)
          return
        }
        setMotivoDesconf('')
        setErroDesconf(null)
        router.refresh()
      } finally {
        setAProcessar(null)
      }
    })
  }

  if (subtarefas.length === 0) {
    return (
      <p className="text-sm text-brand-deep/50 py-2">
        Ainda sem subtarefas. Cria a primeira abaixo.
      </p>
    )
  }

  return (
    <>
      <ul className="border-t border-brand-divider">
        {subtarefas.map((s) => {
          const responsaveis = s.subtarefa_responsaveis?.map((r) => r.pessoas?.nome) ?? []
          const souResponsavel = s.subtarefa_responsaveis?.some((r) => r.pessoa_id === pessoaAtualId)
          const souCriador = s.criado_por_id === pessoaAtualId
          const possoConcluir =
            s.status === 'aprovada' && (ehSuper || souCriador || souResponsavel)
          const possoEditar =
            ehSuper || (s.criado_por_id === pessoaAtualId && s.status === 'pendente_aprovacao')
          const possoMudarEstado =
            (ehSuper || souResponsavel || souCriador) && ESTADOS_ABERTOS.includes(s.status)
          const emEdicaoAgora = emEdicao === s.id
          const info = ROTULOS[s.status] ?? ROTULOS.pendente_aprovacao

          return (
            <li key={s.id} className="py-4 border-b border-brand-divider">
              {emEdicaoAgora ? (
                <FormSubtarefaInline
                  atividadeId={atividadeId}
                  equipa={equipa}
                  subtarefa={s}
                  aoTerminar={() => setEmEdicao(null)}
                />
              ) : (
                <div className="flex items-start gap-3">
                  {/* Dot de estado */}
                  <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${info.dot}`} aria-hidden="true" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-semibold text-brand-deep ${s.status === 'concluida' ? 'line-through opacity-60' : ''}`}>
                        {s.titulo}
                      </p>
                      <span className={`badge ${info.cls}`}>{info.label}</span>
                      {s.status !== 'concluida' && s.prazo && new Date(s.prazo) < new Date() && (
                        <span className="badge bg-red-500/10 text-red-600">Em atraso</span>
                      )}
                      <Link
                        href={`/atividades/${atividadeId}/subtarefas/${s.id}`}
                        className="ml-auto text-[12px] text-brand-accent hover:text-brand-primary underline underline-offset-2 shrink-0"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                    {s.descricao && (
                      <p className="text-sm text-brand-deep/60 mt-1">{s.descricao}</p>
                    )}
                    <p className="text-xs text-brand-deep/45 mt-1.5">
                      Criada por {s.criado_por?.nome}
                      {s.prazo && ` · prazo ${formatarDataSegura(s.prazo)}`}
                      {responsaveis.length > 0 && ` · resp. ${responsaveis.join(', ')}`}
                      {s.status === 'rejeitada' && s.aprovado_por && ` · rejeitada por ${s.aprovado_por?.nome}`}
                    </p>

                    {/* Motivo da recusa — confidencial, só super_admin */}
                    {ehSuper && s.status === 'rejeitada' && s.motivo_recusa?.[0]?.motivo && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-amber-500/[0.07] border border-amber-500/20 px-3 py-2.5">
                        <MessageSquareWarning size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                            Motivo da recusa · confidencial
                          </p>
                          <p className="text-sm text-brand-deep/80 mt-0.5 whitespace-pre-line">
                            {s.motivo_recusa[0].motivo}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Botões de estado do responsável/criador (caixa de relatório) */}
                    {possoMudarEstado && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.status !== 'concluida' && (
                          <button
                            disabled={aProcessar === s.id}
                            onClick={() => abrirMudancaEstado(s, 'concluida')}
                            className="btn btn-small btn-accent"
                          >
                            {aProcessar === s.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Marcar como concluída
                          </button>
                        )}
                        {s.status !== 'cancelada' && (
                          <button
                            disabled={aProcessar === s.id}
                            onClick={() => abrirMudancaEstado(s, 'cancelada')}
                            className="btn btn-small btn-secondary"
                          >
                            {aProcessar === s.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                            Cancelar
                          </button>
                        )}
                        {s.status !== 'erro' && (
                          <button
                            disabled={aProcessar === s.id}
                            onClick={() => abrirMudancaEstado(s, 'erro')}
                            className="btn btn-small btn-danger"
                          >
                            {aProcessar === s.id ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                            Registrar erro
                          </button>
                        )}
                        {/* Recusar a própria atribuição (só responsáveis) */}
                        {souResponsavel && (
                          <button
                            disabled={aProcessar === s.id}
                            onClick={() => pedirDesconfirmarAtribuicao(s)}
                            className="btn btn-small btn-ghost border border-brand-divider text-brand-deep/70"
                          >
                            {aProcessar === s.id ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                            Recusar a minha atribuição
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {aProcessar === s.id ? (
                      <Loader2 size={18} className="animate-spin text-brand-accent" />
                    ) : (
                      <>
                        {ehSuper && s.status === 'pendente_aprovacao' && (
                          <>
                            <button
                              title="Aprovar"
                              onClick={() => executar(aprovarSubtarefa, s.id)}
                              className="w-8 h-8 grid place-items-center rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition-colors"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              title="Recusar (motivo obrigatório)"
                              onClick={() => pedirRecusar(s)}
                              className="w-8 h-8 grid place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}
                        {possoConcluir && (
                          <button
                            title="Marcar como concluída (com relatório)"
                            onClick={() => abrirMudancaEstado(s, 'concluida')}
                            className="w-8 h-8 grid place-items-center rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        {possoEditar && (
                          <button
                            title="Editar"
                            onClick={() => setEmEdicao(s.id)}
                            className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/45 hover:text-brand-primary hover:bg-brand-bg-alt transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {ehSuper && s.status === 'rejeitada' && (
                          <button
                            title="Reverter recusa — volta a aprovação"
                            onClick={() => executar(retratarRecusaSubtarefa, s.id)}
                            className="w-8 h-8 grid place-items-center rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                        {possoApagar(s, ehSuper, pessoaAtualId) && (
                          <button
                            title="Eliminar"
                            onClick={() => pedirEliminar(s)}
                            className="w-8 h-8 grid place-items-center rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {caixaConfirmacao}
      {caixaConfirmacaoEstado}
      {caixaDesconf}
    </>
  )
}

function possoApagar(s, ehSuper, pessoaAtualId) {
  return ehSuper || (s.criado_por_id === pessoaAtualId && s.status === 'pendente_aprovacao')
}

function formatarDataSegura(v) {
  if (!v) return null
  return new Date(v).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PLACEHOLDERS_ESTADO = {
  concluida: 'Ex.: entrega realizada com sucesso…',
  cancelada: 'Ex.: a tarefa já não é necessária neste momento…',
  erro: 'Ex.: bloqueado por pendência externa; sem acesso ao serviço X…',
}
