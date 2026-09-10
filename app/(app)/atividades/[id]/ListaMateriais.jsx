'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { alternarMaterial } from '../actions'

/**
 * Checklist de materiais do evento: qualquer membro marca/desmarca.
 * Fica quem marcou e quando; a coordenação vê o progresso de relance.
 */
export default function ListaMateriais({ atividadeId, materiais, pessoaAtualId }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)

  const itens = [...(materiais ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  const concluidos = itens.filter((m) => m.feito).length

  async function alternar(id, feito) {
    setAProcessar(id)
    try {
      await alternarMaterial(atividadeId, id, feito)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  const pct = itens.length ? Math.round((concluidos / itens.length) * 100) : 0

  return (
    <div className="mt-1">
      {/* Progresso */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-brand-bg-alt border border-brand-divider overflow-hidden">
          <div
            className="h-full bg-brand-accent transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[12.5px] text-brand-deep/55 tabular-nums shrink-0">
          <strong className="text-brand-deep">{concluidos}</strong>/{itens.length} prontos
        </span>
      </div>

      {/* Itens */}
      <ul className="mt-3 space-y-1.5">
        {itens.map((m) => {
          const porMim = m.feito_por?.id === pessoaAtualId
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => alternar(m.id, !m.feito)}
                disabled={aProcessar === m.id}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                  m.feito
                    ? 'border-brand-accent/30 bg-brand-accent/[0.07]'
                    : 'border-brand-divider bg-brand-card hover:border-brand-accent/40'
                }`}
                aria-pressed={m.feito}
              >
                {/* Caixa de marcação */}
                <span
                  className={`w-5 h-5 rounded-md grid place-items-center border-2 shrink-0 transition-colors ${
                    m.feito
                      ? 'bg-brand-accent border-brand-accent text-white'
                      : 'border-brand-deep/25 text-transparent'
                  }`}
                >
                  {aProcessar === m.id ? (
                    <Loader2 size={12} className="animate-spin text-brand-accent" />
                  ) : (
                    <Check size={13} strokeWidth={3.5} />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[14px] truncate ${
                      m.feito ? 'text-brand-deep/45 line-through' : 'text-brand-deep font-medium'
                    }`}
                  >
                    {m.nome}
                  </span>
                  {m.feito && m.feito_por && (
                    <span className="block text-[11px] text-brand-deep/40">
                      {porMim ? 'marcaste tu' : `marcado por ${m.feito_por.nome}`}
                      {m.feito_em &&
                        ` · ${new Date(m.feito_em).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'short',
                        })}`}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
