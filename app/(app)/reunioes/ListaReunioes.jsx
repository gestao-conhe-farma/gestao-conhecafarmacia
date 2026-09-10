'use client'

import Link from 'next/link'
import { CalendarCheck, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { confirmarPresencaReuniao } from './actions'

function rotuloEstado(r) {
  if (r.estado === 'cancelada') return { txt: 'Cancelada', cls: 'bg-red-500/10 text-red-600' }
  if (r.estado === 'realizada') return { txt: 'Realizada', cls: 'bg-brand-accent/10 text-brand-accent' }
  return null
}

export default function ListaReunioes({ reunioes, pessoaAtualId, ehSuper, futuras = false }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)

  async function confirmar(reuniaoId) {
    setAProcessar(reuniaoId)
    try {
      await confirmarPresencaReuniao(reuniaoId)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  return (
    <div className="border-t border-brand-divider">
      {reunioes.map((r) => {
        const meu = r.reuniao_participantes?.find((p) => p.pessoa_id === pessoaAtualId)
        const confirmadas = r.reuniao_participantes?.filter((p) => p.status === 'confirmado').length ?? 0
        const estado = rotuloEstado(r)
        const passada = !futuras

        return (
          <div
            key={r.id}
            className="border-b border-brand-divider py-4 px-1 -mx-1 flex flex-wrap items-center gap-4 hover:bg-brand-primary/[0.03] transition-colors"
          >
            {/* Data em destaque editorial */}
            <div className="w-14 shrink-0 text-center">
              <p className="text-[26px] leading-none font-extrabold text-brand-deep tabular-nums">
                {new Date(r.data_hora).getDate().toString().padStart(2, '0')}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-deep/45 mt-1">
                {new Date(r.data_hora).toLocaleDateString('pt-PT', { month: 'short' })}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/reunioes/${r.id}`}
                  className="font-semibold text-brand-deep text-[14.5px] hover:text-brand-primary transition-colors truncate"
                >
                  {r.titulo}
                </Link>
                {r.tipo === 'urgente' ? (
                  <span className="badge bg-amber-500/10 text-amber-600 shrink-0">Urgente</span>
                ) : (
                  <span className="badge bg-brand-primary/10 text-brand-primary shrink-0">Mensal</span>
                )}
                {estado && (
                  <span className={`badge shrink-0 normal-case ${estado.cls}`}>{estado.txt}</span>
                )}
              </div>
              <p className="text-xs font-mono tracking-wide text-brand-deep/45 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>
                  {new Date(r.data_hora).toLocaleTimeString('pt-PT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {r.local && <span className="font-sans">{r.local}</span>}
                <span className="font-sans">
                  {confirmadas}/{r.reuniao_participantes?.length ?? 0} confirmaram
                </span>
                {r.resumo_publicado_em && (
                  <span className="font-sans text-brand-accent">ata publicada</span>
                )}
              </p>
            </div>

            {/* Ações: confirmar presença (se convocado e futura) */}
            <div className="flex items-center gap-2 shrink-0">
              {meu?.status === 'convidado' && !passada && r.estado === 'agendada' && (
                <button
                  onClick={() => confirmar(r.id)}
                  disabled={aProcessar === r.id}
                  className="btn btn-accent btn-small"
                >
                  {aProcessar === r.id ? (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full" />
                  ) : (
                    <CalendarCheck size={14} />
                  )}
                  Confirmar presença
                </button>
              )}
              {meu?.status === 'confirmado' && !passada && (
                <span className="badge badge-status-confirmado">
                  <Check size={12} /> Presença confirmada
                </span>
              )}
              <Link
                href={`/reunioes/${r.id}`}
                className="btn btn-small btn-ghost border border-brand-divider text-brand-deep/70"
              >
                Abrir
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
