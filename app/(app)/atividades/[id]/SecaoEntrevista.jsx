'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, CalendarX, Check, Loader2, UserPlus } from 'lucide-react'
import { confirmarParticipacao, desconfirmarParticipacao, convidarParticipantes } from '../actions'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

export default function SecaoEntrevista({
  atividadeId,
  participantes,
  ehSuper,
  meuConvite,
  equipa,
  confirmadas = 0,
  num = '01',
}) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)
  const [modoConvidar, setModoConvidar] = useState(false)
  const [selecionadas, setSelecionadas] = useState([])
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

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

  function pedirDesconfirmar() {
    return pedirConfirmacao({
      titulo: 'Desconfirmar a tua presença?',
      descricao: 'Voltas a ficar como “convidado”. Podes confirmar de novo a qualquer momento.',
      confirmarTxt: 'Desconfirmar',
      perigoso: true,
    }).then(async (ok) => {
      if (!ok) return
      setAProcessar(true)
      try {
        await desconfirmarParticipacao(atividadeId)
        router.refresh()
      } finally {
        setAProcessar(false)
      }
    })
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
    <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
      <span className="sec-num">{num}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">
            Participantes da entrevista
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {meuConvite?.status === 'convidado' && (
              <button onClick={confirmar} disabled={aProcessar} className="btn btn-accent btn-small">
                {aProcessar ? <Loader2 className="animate-spin" size={15} /> : <CalendarCheck size={15} />}
                Confirmar a minha presença
              </button>
            )}
            {meuConvite?.status === 'confirmado' && (
              <>
                <span className="badge badge-status-confirmado shrink-0">
                  <Check size={12} /> Presença confirmada
                </span>
                <button onClick={pedirDesconfirmar} disabled={aProcessar} className="btn btn-secondary btn-small">
                  {aProcessar ? <Loader2 size={14} className="animate-spin" /> : <CalendarX size={14} />}
                  Desconfirmar
                </button>
              </>
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

        {confirmadas > 0 && (
          <p className="text-sm text-brand-deep/45 mt-1.5 tabular-nums">
            <strong className="text-brand-deep">{confirmadas}</strong> de{' '}
            <strong className="text-brand-deep">{participantes.length}</strong> confirmaram presença
          </p>
        )}

      {/* Convidar mais pessoas */}
      {modoConvidar && (
        <div className="mt-5 p-4 rounded-xl panel">
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
                className={`chip-btn ${
                  selecionadas.includes(p.id)
                    ? 'chip-btn-on'
                    : 'chip-btn-off'
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
        <p className="text-sm text-brand-deep/50 py-4">
          Ainda sem participantes convidados.
        </p>
      ) : (
        <ul className="mt-5 border-t border-brand-divider">
          {participantes.map((p) => (
            <li
              key={p.pessoa_id}
              className="flex items-center gap-3 py-3 border-b border-brand-divider"
            >
              <span className="w-9 h-9 rounded-full bg-brand-bg-alt border border-brand-divider text-brand-deep grid place-items-center font-bold text-[11px] shrink-0">
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

      {caixaConfirmacao}
    </section>
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
