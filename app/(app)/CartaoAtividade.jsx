'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Clock } from 'lucide-react'

const ROTULOS = { atividade: 'Atividade', evento: 'Evento', entrevista: 'Entrevista' }

function estadoInfo(atividade) {
  if (atividade.status_evento === 'concluida') {
    return { cor: 'bg-brand-accent', label: 'Concluída' }
  }
  if (atividade.prazo && new Date(atividade.prazo) < new Date()) {
    return { cor: 'bg-red-500', label: 'Em atraso' }
  }
  if (atividade.tipo === 'evento' && atividade.status_evento === 'em_andamento') {
    return { cor: 'bg-amber-500', label: 'Em andamento' }
  }
  return { cor: 'bg-brand-accent', label: 'Em curso' }
}

export default function CartaoAtividade({ atividade }) {
  const responsaveis = atividade.atividade_responsaveis?.map((r) => r.pessoas?.nome) ?? []
  const prazo = atividade.prazo ? new Date(atividade.prazo) : null
  const estado = estadoInfo(atividade)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        href={`/atividades/${atividade.id}`}
        className="group grid grid-cols-[56px_1fr_auto] items-center gap-5 py-5 border-b border-brand-divider hover:bg-brand-primary/[0.03] transition-colors -mx-3 px-3 rounded-lg focus-visible:outline-offset-[-2px]"
        aria-label={`${ROTULOS[atividade.tipo]}: ${atividade.titulo}`}
      >
        {/* Coluna de data — grande, editorial */}
        <div className="text-center">
          {prazo ? (
            <>
              <span className="block text-[22px] font-extrabold text-brand-deep leading-none tracking-tight">
                {String(prazo.getDate()).padStart(2, '0')}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-brand-deep/40 mt-1">
                {prazo.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '')}
              </span>
            </>
          ) : (
            <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-brand-deep/30">
              Sem
              <br />
              prazo
            </span>
          )}
        </div>

        {/* Título + meta */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estado.cor}`} aria-hidden="true" />
            <h3 className="text-[15.5px] font-bold text-brand-deep leading-snug truncate group-hover:text-brand-primary transition-colors">
              {atividade.titulo}
            </h3>
          </div>
          <p className="text-xs text-brand-deep/50 mt-1 truncate">
            <span className="uppercase tracking-[0.1em] text-[10px] font-bold text-brand-deep/35">
              {ROTULOS[atividade.tipo]}
            </span>
            {responsaveis.length > 0 && <> · {responsaveis.join(', ')}</>}
            {prazo && (
              <>
                {' · '}
                <Clock size={10} className="inline -mt-0.5" />
                {prazo.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
              </>
            )}
          </p>
        </div>

        <ChevronRight
          size={17}
          className="text-brand-deep/25 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all shrink-0"
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  )
}
