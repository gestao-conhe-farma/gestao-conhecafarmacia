'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { useConfirmacao } from '@/components/CaixaConfirmacao'
import { mudarEstadoSubtarefa } from '../../../subtarefas-actions'

const ROTULOS = {
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  erro: 'Erro',
}

const PLACEHOLDERS = {
  concluida: 'Ex.: entrega realizada com sucesso…',
  cancelada: 'Ex.: a tarefa já não é necessária neste momento…',
  erro: 'Ex.: bloqueado por pendência externa; sem acesso ao serviço X…',
}

/**
 * Botões de estado para o responsável atribuído (ou criador) da subtarefa,
 * com caixa de relatório (justificativa obrigatória, privada ao autor e à
 * coordenação). Renderiza os botões e a própria caixa de confirmação.
 */
export default function AcoesEstadoSubtarefa({ sub, pessoaAtualId }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)
  const [motivoEstado, setMotivoEstado] = useState('')
  const [erroEstado, setErroEstado] = useState(null)
  const [pedirConfirmacaoEstado, caixaConfirmacaoEstado] = useConfirmacao()

  const souResponsavel = sub.subtarefa_responsaveis?.some((r) => r.pessoa_id === pessoaAtualId)
  const souCriador = sub.criado_por_id === pessoaAtualId

  if (!souResponsavel && !souCriador) return null
  if (!['aprovada', 'concluida', 'cancelada', 'erro'].includes(sub.status)) return null

  function abrirMudancaEstado(estado) {
    setMotivoEstado('')
    setErroEstado(null)
    return pedirConfirmacaoEstado({
      titulo: `Mudar o estado para ${ROTULOS[estado]}?`,
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
            placeholder={PLACEHOLDERS[estado]}
            value={motivoEstado}
            onChange={(e) => setMotivoEstado(e.target.value)}
          />
          {erroEstado && <p className="text-sm text-red-600 mt-2">{erroEstado}</p>}
        </div>
      ),
    }).then(async (ok) => {
      if (!ok) return
      if (!motivoEstado.trim()) {
        setErroEstado('O relatório é obrigatório.')
        return
      }
      setAProcessar(estado)
      try {
        const r = await mudarEstadoSubtarefa(sub.id, estado, motivoEstado)
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

  return (
    <section className="card p-5 mb-6">
      <h2 className="text-sm font-bold text-brand-deep/60 uppercase tracking-wider mb-3">
        Atualizar o estado da subtarefa
      </h2>
      <p className="text-[13.5px] text-brand-deep/55 mb-4 leading-relaxed">
        Regista como correu a tua parte. Cada mudança pede uma caixa de relatório
        — visível apenas a ti e à coordenação.
      </p>
      <div className="flex flex-wrap gap-2">
        {sub.status !== 'concluida' && (
          <button
            disabled={Boolean(aProcessar)}
            onClick={() => abrirMudancaEstado('concluida')}
            className="btn btn-small btn-accent"
          >
            {aProcessar === 'concluida' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Marcar como concluída
          </button>
        )}
        {sub.status !== 'cancelada' && (
          <button
            disabled={Boolean(aProcessar)}
            onClick={() => abrirMudancaEstado('cancelada')}
            className="btn btn-small btn-secondary"
          >
            {aProcessar === 'cancelada' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Cancelar
          </button>
        )}
        {sub.status !== 'erro' && (
          <button
            disabled={Boolean(aProcessar)}
            onClick={() => abrirMudancaEstado('erro')}
            className="btn btn-small btn-danger"
          >
            {aProcessar === 'erro' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <AlertCircle size={14} />
            )}
            Registrar erro
          </button>
        )}
      </div>
      {caixaConfirmacaoEstado}
    </section>
  )
}
