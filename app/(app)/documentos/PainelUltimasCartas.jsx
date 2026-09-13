'use client'

import { MailOpen } from 'lucide-react'

/**
 * PainelUltimasCartas — para cada tipo de carta (CF-MEM, CF-PAR,
 * CF-PAT, CF-REG, CF-SOL), mostra a última emitida e qual o número
 * seguinte a usar. Visível a toda a equipa: assim todos sabem qual
 * o código dar à próxima carta sem ter de perguntar.
 */
export default function PainelUltimasCartas({ cartas }) {
  if (!cartas?.length) return null

  return (
    <div className="mt-6 pt-5 border-t border-dashed border-brand-divider">
      <div className="flex items-center gap-2 mb-3">
        <MailOpen size={16} className="text-brand-accent" />
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-deep/50">
          Últimas cartas por tipo
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {cartas.map((c) => (
          <div key={c.prefixo} className="card p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="badge bg-brand-primary/10 text-brand-primary">{c.prefixo}</span>
              <span className="text-[11px] text-brand-deep/45 tabular-nums">
                {c.total} {c.total === 1 ? 'carta' : 'cartas'}
              </span>
            </div>

            <div className="min-w-0">
              <p className="font-mono text-[13px] font-semibold text-brand-deep truncate">
                {c.ultimo_codigo}
              </p>
              <p className="text-[12.5px] text-brand-deep/65 truncate" title={c.ultimo_titulo}>
                {c.ultimo_titulo}
              </p>
            </div>

            <div className="pt-2 border-t border-brand-divider/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-brand-deep/50">A seguir:</span>
              <span className="font-mono text-[13px] font-bold text-brand-accent">
                {c.proximo_codigo}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
