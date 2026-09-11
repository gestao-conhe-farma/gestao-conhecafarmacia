'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, RefreshCcw, Users } from 'lucide-react'
import { concluirEvento, reabrirEvento, definirPublicoReal } from '../actions'

const ROTULOS = {
  planeada: 'Planeada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
}

export default function PainelEvento({
  atividadeId,
  status,
  ehSuper,
  filhas,
  esperado,
  real,
  num = '01',
}) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)
  const [pedirReal, setPedirReal] = useState(false)
  const [valorReal, setValorReal] = useState('')
  const [erro, setErro] = useState(null)

  async function mudar(novoEstado) {
    setAProcessar(true)
    setErro(null)
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

  async function concluirComAudiencia(e) {
    e.preventDefault()
    setAProcessar(true)
    setErro(null)
    try {
      const r = await concluirEvento(atividadeId, valorReal)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setPedirReal(false)
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  async function corrigirAudiencia(e) {
    e.preventDefault()
    setAProcessar(true)
    setErro(null)
    try {
      const r = await definirPublicoReal(atividadeId, valorReal)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setPedirReal(false)
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
            onClick={() => (s === 'concluida' && ehSuper ? setPedirReal(true) : mudar(s))}
            className={`filter-btn ${status === s ? 'active' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {ROTULOS[s]}
          </button>
        ))}
      </div>

      {/* Concluir com registo de audiência real */}
      {pedirReal && ehSuper && status !== 'concluida' && (
        <form onSubmit={concluirComAudiencia} className="card p-4 mt-4 max-w-md space-y-3">
          <p className="text-sm font-bold text-brand-deep flex items-center gap-2">
            <Users size={15} className="text-brand-accent" />
            Participantes reais
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              className="form-input !w-32"
              placeholder={esperado != null ? String(esperado) : 'Ex.: 85'}
              value={valorReal}
              onChange={(e) => setValorReal(e.target.value)}
              autoFocus
            />
            <span className="text-[13px] text-brand-deep/50">
              {esperado != null ? `· esperados ${esperado}` : '· sem valor esperado definido'}
            </span>
          </div>
          <p className="text-xs text-brand-deep/45">
            Podes deixar vazio e registar depois. A conclusão é sempre manual —
            nunca calculada das subtarefas.
          </p>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={aProcessar} className="btn btn-accent btn-small">
              {aProcessar ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Concluir evento
            </button>
            <button
              type="button"
              onClick={() => setPedirReal(false)}
              className="btn btn-small btn-ghost border border-brand-divider"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Comparação esperado vs. real (evento concluído) */}
      {status === 'concluida' && ehSuper && (
        <div className="mt-5 pt-5 border-t border-dashed border-brand-divider max-w-md">
          <span className="meta-label">Audiência</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-extrabold text-brand-deep tabular-nums">
              {real ?? '—'}
            </span>
            <span className="text-sm text-brand-deep/45">
              / {esperado ?? '—'} esperados
            </span>
            {real != null && esperado != null && esperado > 0 && (() => {
              const pct = Math.round((real / esperado) * 100)
              const boa = pct >= 90
              const cls = boa
                ? 'bg-brand-accent/10 text-brand-accent'
                : pct >= 60
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-red-500/10 text-red-600'
              return <span className={`badge normal-case ${cls}`}>{pct}% do esperado</span>
            })()}
            {real != null && (esperado == null || esperado === 0) && (
              <span className="badge normal-case bg-brand-bg-alt text-brand-deep/55 border border-brand-divider">
                sem meta definida
              </span>
            )}
          </div>
          {pedirReal ? (
            <form onSubmit={corrigirAudiencia} className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min="0"
                className="form-input !w-32"
                value={valorReal}
                onChange={(e) => setValorReal(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={aProcessar} className="btn btn-primary btn-small">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setPedirReal(false)}
                className="btn btn-small btn-ghost border border-brand-divider"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setValorReal(real != null ? String(real) : '')
                setPedirReal(true)
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-deep/50 hover:text-brand-primary transition-colors"
            >
              <RefreshCcw size={12} />
              {real != null ? 'Corrigir' : 'Registar participantes reais'}
            </button>
          )}
        </div>
      )}

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
