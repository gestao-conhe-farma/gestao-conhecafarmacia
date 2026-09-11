'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, X } from 'lucide-react'
import { aprovarSubtarefa, rejeitarSubtarefa } from '../atividades/subtarefas-actions'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

export default function ListaAprovacoes({ pendentes }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [erroRecusa, setErroRecusa] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  async function aprovar(id) {
    setAProcessar(id)
    try {
      await aprovarSubtarefa(id)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  function pedirRecusar(s) {
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
          {erroRecusa && <p className="text-sm text-red-600 mt-2">{erroRecusa}</p>}
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
        router.refresh()
      } finally {
        setAProcessar(null)
      }
    })
  }

  return (
    <>
      <ul className="border-t border-brand-divider">
        {pendentes.map((s) => (
          <li key={s.id} className="py-5 border-b border-brand-divider">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-deep">{s.titulo}</p>
                {s.descricao && (
                  <p className="text-sm text-brand-deep/60 mt-1">{s.descricao}</p>
                )}
                <p className="text-xs text-brand-deep/45 mt-1.5">
                  Criada por <strong>{s.criado_por?.nome}</strong>
                  {s.prazo &&
                    ` · prazo ${new Date(s.prazo).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}`}
                  {s.subtarefa_responsaveis?.length > 0 &&
                    ` · resp. ${s.subtarefa_responsaveis.map((r) => r.pessoas?.nome).join(', ')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {aProcessar === s.id ? (
                  <Loader2 size={20} className="animate-spin text-brand-accent" />
                ) : (
                  <>
                    <button onClick={() => aprovar(s.id)} className="btn btn-accent btn-small">
                      <Check size={15} />
                      Aprovar
                    </button>
                    <button onClick={() => pedirRecusar(s)} className="btn btn-danger btn-small">
                      <X size={15} />
                      Recusar
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {caixaConfirmacao}
    </>
  )
}
