'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CalendarCheck, Check, Loader2 } from 'lucide-react'
import { confirmarParticipacao } from '../atividades/actions'

export default function CartaoEntrevista({ entrevista }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)

  async function confirmar() {
    setAProcessar(true)
    try {
      await confirmarParticipacao(entrevista.id)
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  const convidado = entrevista.meu_status === 'convidado'
  const confirmado = entrevista.meu_status === 'confirmado'

  return (
    <div className="py-5 border-b border-brand-divider flex flex-wrap items-center gap-4">
      <div className="min-w-0 flex-1">
        <Link
          href={`/atividades/${entrevista.id}`}
          className="text-[16px] font-bold text-brand-deep hover:text-brand-primary transition-colors"
        >
          {entrevista.titulo}
        </Link>
        {entrevista.prazo && (
          <p className="text-sm text-brand-deep/55 mt-0.5">
            {new Date(entrevista.prazo).toLocaleString('pt-PT', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {confirmado && (
          <span className="badge badge-status-confirmado">
            <Check size={12} /> Confirmada
          </span>
        )}
        {convidado && (
          <button onClick={confirmar} disabled={aProcessar} className="btn btn-accent btn-small">
            {aProcessar ? <Loader2 className="animate-spin" size={15} /> : <CalendarCheck size={15} />}
            Confirmar presença
          </button>
        )}
      </div>
    </div>
  )
}
