'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'
import { concluirEvento, reabrirEvento } from '../actions'

const ROTULOS = {
  planeada: 'Planeada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
}

export default function PainelEvento({ atividadeId, status, ehSuper, filhas }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)

  async function mudar(novoEstado) {
    setAProcessar(true)
    try {
      if (novoEstado === 'concluida') {
        await concluirEvento(atividadeId)
      } else {
        await reabrirEvento(atividadeId, novoEstado)
      }
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <div className="card p-6 md:p-8 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-bold text-brand-deep">Estado do evento</h2>
        {ehSuper && aProcessar && <Loader2 size={18} className="animate-spin text-brand-accent" />}
      </div>

      <p className="text-sm text-brand-deep/55 mb-4">
        A conclusão de um evento é sempre manual — nunca calculada a partir das
        subtarefas — para permitir comparar o desempenho por responsável no
        momento do encerramento.
      </p>

      <div className="flex flex-wrap gap-2">
        {['planeada', 'em_andamento', 'concluida'].map((s) => (
          <button
            key={s}
            disabled={!ehSuper || aProcessar || status === s}
            onClick={() => mudar(s)}
            className={`filter-btn ${status === s ? 'active' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {ROTULOS[s]}
          </button>
        ))}
      </div>

      {filhas.length > 0 && (
        <div className="mt-6 pt-6 border-t border-brand-divider/60">
          <h3 className="text-sm font-bold text-brand-deep mb-3">
            Atividades subordinadas a este evento
          </h3>
          <ul className="space-y-2">
            {filhas.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/atividades/${f.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-brand-divider/60 hover:border-brand-accent/50 transition-colors"
                >
                  <span className={`badge badge-tipo-${f.tipo}`}>{f.tipo}</span>
                  <span className="text-sm font-medium text-brand-deep flex-1 truncate">
                    {f.titulo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
