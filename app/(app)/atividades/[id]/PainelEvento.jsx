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

export default function PainelEvento({ atividadeId, status, ehSuper, filhas, num = '01' }) {
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
    <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
      <span className="sec-num">{num}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">Estado do evento</h2>
          {ehSuper && aProcessar && <Loader2 size={18} className="animate-spin text-brand-accent" />}
        </div>

        <p className="text-[13.5px] text-brand-deep/55 mt-1 max-w-xl leading-relaxed">
          A conclusão de um evento é sempre manual — nunca calculada a partir das
          subtarefas — para permitir comparar o desempenho por responsável no
          momento do encerramento.
        </p>

        <div className="flex flex-wrap gap-2 mt-5">
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
        <div className="mt-7 pt-6 border-t border-dashed border-brand-divider">
          <h3 className="text-sm font-bold text-brand-deep mb-3">
            Atividades subordinadas a este evento
          </h3>
          <ul className="space-y-2">
            {filhas.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/atividades/${f.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-brand-divider hover:border-brand-accent/50 transition-colors"
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
    </section>
  )
}
