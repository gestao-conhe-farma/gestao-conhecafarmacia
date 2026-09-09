'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Clock } from 'lucide-react'

const ROTULOS = { atividade: 'Atividade', evento: 'Evento', entrevista: 'Entrevista' }
const BADGE = {
  atividade: 'badge-tipo-atividade',
  evento: 'badge-tipo-evento',
  entrevista: 'badge-tipo-entrevista',
}

export default function CartaoAtividade({ atividade }) {
  const responsaveis = atividade.atividade_responsaveis?.map((r) => r.pessoas?.nome) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Link
        href={`/atividades/${atividade.id}`}
        className="card p-6 flex flex-col h-full hover:shadow-md-soft hover:-translate-y-1 transition-all duration-300"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className={`badge ${BADGE[atividade.tipo]}`}>{ROTULOS[atividade.tipo]}</span>
          {atividade.tipo === 'evento' && atividade.status_evento && (
            <span className="badge badge-status-pendente normal-case">
              {atividade.status_evento === 'planeada'
                ? 'Planeada'
                : atividade.status_evento === 'em_andamento'
                  ? 'Em andamento'
                  : 'Concluída'}
            </span>
          )}
          {atividade.prazo && (
            <span className="ml-auto text-xs text-brand-deep/50 inline-flex items-center gap-1">
              <Clock size={12} />
              {new Date(atividade.prazo).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          )}
        </div>

        <h3 className="font-display text-lg font-bold text-brand-deep leading-snug">
          {atividade.titulo}
        </h3>
        {atividade.descricao && (
          <p className="text-sm text-brand-deep/60 mt-2 line-clamp-2 flex-1">
            {atividade.descricao}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-brand-divider/60 flex items-center justify-between gap-3">
          <div className="text-xs text-brand-deep/50 truncate">
            {responsaveis.length > 0
              ? responsaveis.join(', ')
              : `${atividade.criado_por?.nome ?? ''}`}
          </div>
          <ArrowRight size={15} className="text-brand-accent shrink-0" />
        </div>
      </Link>
    </motion.div>
  )
}
