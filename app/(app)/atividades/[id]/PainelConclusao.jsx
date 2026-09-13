'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { useConfirmacao } from '@/components/CaixaConfirmacao'
import { concluirAtividade, reabrirAtividadeConcluida } from '../actions'

/**
 * Painel de conclusão para atividade/evento/entrevista — paridade com
 * o fluxo das subtarefas. Aparece no fundo da página da atividade.
 *
 * Permissões (validadas de novo no server action):
 *  - coordenação (super_admin): única com acesso — concluir o TODO
 *    (atividade/evento/entrevista) é decisão da coordenação; membros
 *    concluem as suas subtarefas nas secções próprias.
 *
 * Concluir é reversível — "Reabrir" volta a pôr em andamento.
 * Eventos mantêm o PainelEvento próprio (com audiência real) em cima;
 * este painel não se repete para eles.
 */
export default function PainelConclusao({ atividadeId, statusEvento }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)
  const [erro, setErro] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  const concluida = statusEvento === 'concluida'

  async function concluir() {
    const ok = await pedirConfirmacao({
      titulo: 'Concluir esta atividade?',
      descricao:
        'Fica marcada como concluída no painel e na lista — a equipa deixa de a ver como em curso. Podes reabrir depois, se for preciso.',
      textoBotao: 'Concluir',
    })
    if (!ok) return

    setAProcessar(true)
    setErro(null)
    const r = await concluirAtividade(atividadeId)
    setAProcessar(false)

    if (!r.ok) {
      setErro(r.erro)
      return
    }
    router.refresh()
  }

  async function reabrir() {
    setAProcessar(true)
    setErro(null)
    const r = await reabrirAtividadeConcluida(atividadeId)
    setAProcessar(false)

    if (!r.ok) {
      setErro(r.erro)
      return
    }
    router.refresh()
  }

  return (
    <div className="pt-2">
      {concluida ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent">
            <CheckCircle2 size={17} />
            Atividade concluída
          </span>
          <button
            type="button"
            onClick={reabrir}
            disabled={aProcessar}
            className="btn btn-small btn-ghost border border-brand-divider disabled:opacity-50"
          >
            {aProcessar ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            Reabrir
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={concluir}
            disabled={aProcessar}
            className="btn btn-primary disabled:opacity-50"
          >
            {aProcessar ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Concluir atividade
          </button>
          <p className="text-xs text-brand-deep/45">
            Marca como feita — deixa de contar como em curso.
          </p>
        </div>
      )}

      {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}

      {caixaConfirmacao}
    </div>
  )
}
