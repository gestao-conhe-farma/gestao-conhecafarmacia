'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, CheckCircle2 } from 'lucide-react'
import {
  aprovarSubtarefa,
  rejeitarSubtarefa,
  concluirSubtarefa,
} from '../subtarefas-actions'

const ROTULOS = {
  pendente_aprovacao: { label: 'Pendente', cls: 'badge-status-pendente' },
  aprovada: { label: 'Aprovada', cls: 'badge-status-aprovada' },
  rejeitada: { label: 'Rejeitada', cls: 'badge-status-rejeitada' },
  concluida: { label: 'Concluída', cls: 'badge-status-concluida' },
}

export default function ListaSubtarefas({ subtarefas, ehSuper, pessoaAtualId }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)

  async function executar(fn, id) {
    setAProcessar(id)
    try {
      await fn(id)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  if (subtarefas.length === 0) {
    return (
      <p className="text-sm text-brand-deep/50 py-6 text-center">
        Ainda sem subtarefas. Cria a primeira abaixo.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-brand-divider/60">
      {subtarefas.map((s) => {
        const responsaveis = s.subtarefa_responsaveis?.map((r) => r.pessoas?.nome) ?? []
        const possoConcluir =
          s.status === 'aprovada' &&
          (ehSuper || s.criado_por === pessoaAtualId ||
            s.subtarefa_responsaveis?.some((r) => r.pessoa_id === pessoaAtualId))
        const info = ROTULOS[s.status]

        return (
          <li key={s.id} className="py-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-semibold text-brand-deep ${s.status === 'concluida' ? 'line-through opacity-60' : ''}`}>
                    {s.titulo}
                  </p>
                  <span className={`badge ${info.cls}`}>{info.label}</span>
                  {s.status !== 'concluida' && s.prazo && new Date(s.prazo) < new Date() && (
                    <span className="badge bg-red-500/10 text-red-600">Em atraso</span>
                  )}
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
                          title="Rejeitar"
                          onClick={() => executar(rejeitarSubtarefa, s.id)}
                          className="w-8 h-8 grid place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </>
                    )}
                    {possoConcluir && (
                      <button
                        title="Marcar como concluída"
                        onClick={() => executar(concluirSubtarefa, s.id)}
                        className="w-8 h-8 grid place-items-center rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function formatarDataSegura(v) {
  if (!v) return null
  return new Date(v).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}
