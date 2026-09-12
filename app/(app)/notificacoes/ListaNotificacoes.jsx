'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BellOff, Check, CheckCheck, Loader2 } from 'lucide-react'

function quando(iso) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

/** Cor do ponto por tipo de evento — a mesmo família de cores da app. */
const COR_TIPO = {
  convite_reuniao: 'bg-brand-accent',
  reuniao_cancelada: 'bg-red-500',
  ata_publicada: 'bg-brand-accent',
  convite_entrevista: 'bg-sky-500',
  subtarefa_atribuida: 'bg-amber-500',
  subtarefa_pendente: 'bg-violet-500',
  decisao_pendente: 'bg-violet-500',
}

export default function ListaNotificacoes({ iniciais = [] }) {
  const router = useRouter()
  const [itens, setItens] = useState(iniciais)
  const [aProcessar, setAProcessar] = useState(false)

  const naoLidas = itens.filter((n) => !n.lida).length

  async function marcarTodas() {
    setAProcessar(true)
    try {
      await fetch('/api/notificacoes/lidas', { method: 'POST' })
      setItens((atual) => atual.map((n) => ({ ...n, lida: true })))
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  async function marcarUma(id) {
    setItens((atual) => atual.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    await fetch('/api/notificacoes/lidas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  if (!itens.length) {
    return (
      <div className="card p-10 text-center mt-6">
        <BellOff size={28} className="mx-auto text-brand-deep/25 mb-3" />
        <p className="text-sm text-brand-deep/50">
          Ainda não tens notificações — quando te atribuírem algo ou publicarem
          uma ata, aparece aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      {naoLidas > 0 && (
        <div className="flex justify-end mb-3">
          <button onClick={marcarTodas} disabled={aProcessar} className="btn btn-ghost btn-small border border-brand-divider">
            {aProcessar ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            Marcar todas como lidas ({naoLidas})
          </button>
        </div>
      )}

      <ul className="divide-y divide-brand-divider border border-brand-divider rounded-xl overflow-hidden">
        {itens.map((n) => {
          const conteudo = (
            <>
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                n.lida ? 'bg-transparent' : COR_TIPO[n.tipo] ?? 'bg-brand-accent'
              }`} />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm truncate ${n.lida ? 'text-brand-deep/55' : 'font-semibold text-brand-deep'}`}>
                  {n.titulo}
                </span>
                {n.corpo && (
                  <span className="block text-[13px] text-brand-deep/50 line-clamp-2 mt-0.5">{n.corpo}</span>
                )}
                <span className="block text-[11px] text-brand-deep/40 mt-1">{quando(n.criado_em)}</span>
              </span>
              {!n.lida && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault()
                    marcarUma(n.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      marcarUma(n.id)
                    }
                  }}
                  title="Marcar como lida"
                  className="shrink-0 w-7 h-7 grid place-items-center rounded-lg text-brand-deep/40 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                >
                  <Check size={14} />
                </span>
              )}
            </>
          )

          return (
            <li key={n.id} className={n.lida ? 'bg-brand-bg/30' : ''}>
              {n.link ? (
                <Link
                  href={n.link}
                  onClick={() => !n.lida && marcarUma(n.id)}
                  className="flex gap-3 px-4 py-3.5 hover:bg-brand-primary/[0.04] transition-colors"
                >
                  {conteudo}
                </Link>
              ) : (
                <div className="flex gap-3 px-4 py-3.5">{conteudo}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
