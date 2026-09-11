'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserX } from 'lucide-react'
import { useConfirmacao } from '@/components/CaixaConfirmacao'
import { desconfirmarAtribuicaoSubtarefa } from '../../../subtarefas-actions'

/**
 * Recusar a própria atribuição a uma subtarefa (desconfirmação).
 * O responsável atribuído sai da subtarefa com um justificativo
 * obrigatório — privado: só o autor e a coordenação o leem.
 */
export default function AcoesDesconfirmarSubtarefa({ sub, pessoaAtualId }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  const souResponsavel = sub.subtarefa_responsaveis?.some((r) => r.pessoa_id === pessoaAtualId)
  if (!souResponsavel) return null
  if (!['aprovada', 'concluida', 'cancelada', 'erro'].includes(sub.status)) return null

  function pedirDesconfirmar() {
    setMotivo('')
    setErro(null)
    return pedirConfirmacao({
      titulo: 'Recusar a tua atribuição?',
      descricao:
        'Sai da lista de responsáveis desta subtarefa. O justificativo fica registado — só tu e a coordenação o vêem.',
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
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
        </div>
      ),
    }).then(async (ok) => {
      if (!ok) return
      if (!motivo.trim()) {
        setErro('O justificativo é obrigatório.')
        return
      }
      setAProcessar(true)
      try {
        const r = await desconfirmarAtribuicaoSubtarefa(sub.id, motivo)
        if (!r.ok) {
          setErro(r.erro)
          return
        }
        router.refresh()
      } finally {
        setAProcessar(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={pedirDesconfirmar}
        disabled={aProcessar}
        className="btn btn-small btn-secondary"
      >
        {aProcessar ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
        Recusar a minha atribuição
      </button>
      {caixaConfirmacao}
    </>
  )
}
