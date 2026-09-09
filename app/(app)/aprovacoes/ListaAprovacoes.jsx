'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, X } from 'lucide-react'
import { aprovarSubtarefa, rejeitarSubtarefa } from '../atividades/subtarefas-actions'

export default function ListaAprovacoes({ pendentes }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)

  async function decidir(fn, id) {
    setAProcessar(id)
    try {
      await fn(id)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  return (
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
                  <button
                    onClick={() => decidir(aprovarSubtarefa, s.id)}
                    className="btn btn-accent btn-small"
                  >
                    <Check size={15} />
                    Aprovar
                  </button>
                  <button
                    onClick={() => decidir(rejeitarSubtarefa, s.id)}
                    className="btn btn-danger btn-small"
                  >
                    <X size={15} />
                    Rejeitar
                  </button>
                </>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
