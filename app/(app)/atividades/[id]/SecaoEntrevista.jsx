'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, Check, Loader2, UserPlus } from 'lucide-react'
import { confirmarParticipacao, convidarParticipantes } from '../actions'

export default function SecaoEntrevista({
  atividadeId,
  participantes,
  ehSuper,
  meuConvite,
  equipa,
}) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)
  const [modoConvidar, setModoConvidar] = useState(false)
  const [selecionadas, setSelecionadas] = useState([])

  const convidadosIds = participantes.map((p) => p.pessoa_id)
  const disponiveis = equipa.filter((p) => !convidadosIds.includes(p.id))

  async function confirmar() {
    setAProcessar(true)
    try {
      await confirmarParticipacao(atividadeId)
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  async function convidar() {
    if (selecionadas.length === 0) return
    setAProcessar(true)
    try {
      await convidarParticipantes(atividadeId, selecionadas)
      setSelecionadas([])
      setModoConvidar(false)
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <div className="card p-6 md:p-8 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-bold text-brand-deep">
          Participantes da entrevista
        </h2>
        <div className="flex items-center gap-2">
          {meuConvite?.status === 'convidado' && (
            <button onClick={confirmar} disabled={aProcessar} className="btn btn-accent btn-small">
              {aProcessar ? <Loader2 className="animate-spin" size={15} /> : <CalendarCheck size={15} />}
              Confirmar a minha presença
            </button>
          )}
          {meuConvite?.status === 'confirmado' && (
            <span className="badge badge-status-confirmado">
              <Check size={12} /> Presença confirmada
            </span>
          )}
          {ehSuper && (
            <button
              onClick={() => setModoConvidar((v) => !v)}
              className="btn btn-secondary btn-small"
            >
              <UserPlus size={15} />
              Convidar
            </button>
          )}
        </div>
      </div>

      {/* Convidar mais pessoas */}
      {modoConvidar && (
        <div className="mb-5 p-4 rounded-xl bg-brand-bg-alt border border-brand-divider/60">
          <p className="text-sm font-semibold text-brand-deep mb-2">
            Seleciona quem convidar:
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {disponiveis.length === 0 && (
              <p className="text-sm text-brand-deep/50">Toda a equipa já foi convidada.</p>
            )}
            {disponiveis.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  setSelecionadas((atual) =>
                    atual.includes(p.id) ? atual.filter((x) => x !== p.id) : [...atual, p.id]
                  )
                }
                className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                  selecionadas.includes(p.id)
                    ? 'border-[#ff6c23] bg-[#ff6c23]/10 text-[#ff6c23] font-semibold'
                    : 'border-brand-divider text-brand-deep/60'
                }`}
              >
                {p.nome}
              </button>
            ))}
          </div>
          <button
            onClick={convidar}
            disabled={aProcessar || selecionadas.length === 0}
            className="btn btn-accent btn-small"
          >
            {aProcessar ? <Loader2 className="animate-spin" size={15} /> : <UserPlus size={15} />}
            Enviar convites ({selecionadas.length})
          </button>
        </div>
      )}

      {participantes.length === 0 ? (
        <p className="text-sm text-brand-deep/50 py-4 text-center">
          Ainda sem participantes convidados.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {participantes.map((p) => (
            <li
              key={p.pessoa_id}
              className="flex items-center gap-3 p-3 rounded-xl border border-brand-divider/60"
            >
              <span className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary grid place-items-center font-bold text-sm shrink-0">
                {iniciais(p.pessoas?.nome ?? '?')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-deep truncate">
                  {p.pessoas?.nome}
                </p>
                <p className="text-xs text-brand-deep/50 truncate">{p.pessoas?.email}</p>
              </div>
              <span className={`badge ${p.status === 'confirmado' ? 'badge-status-confirmado' : 'badge-status-convidado'}`}>
                {p.status === 'confirmado' ? 'Confirmado' : 'Convidado'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function iniciais(nome) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
