'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CORES_PLATAFORMA, CORES_ESTADO, rotuloPlataforma } from './constants'

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function chaveDia(iso) {
  return String(iso).slice(0, 10)
}

/**
 * Calendário mensal do conteúdo: dias fixos que têm conteúdo, pontos
 * coloridos por plataforma. Clique num dia filtra a lista ao lado
 * (via onSelecionarDia) — navegação simples entre as duas vistas.
 */
export default function CalendarioConteudo({ conteudos = [], onSelecionarDia, diaSelecionado }) {
  const hoje = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [mesRef, setMesRef] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))

  // Índice: dia ISO -> conteúdos desse dia
  const porDia = useMemo(() => {
    const mapa = {}
    for (const c of conteudos) {
      const k = chaveDia(c.data_publicacao)
      ;(mapa[k] ??= []).push(c)
    }
    return mapa
  }, [conteudos])

  const ano = mesRef.getFullYear()
  const mes = mesRef.getMonth()

  // Grelha segunda-primeiro; dias de outros meses ficam a cinza
  const dias = useMemo(() => {
    const primeiro = new Date(ano, mes, 1)
    const inicio = new Date(primeiro)
    inicio.setDate(primeiro.getDate() - ((primeiro.getDay() + 6) % 7))
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio)
      d.setDate(inicio.getDate() + i)
      return d
    })
  }, [ano, mes])

  const passarMes = (delta) => setMesRef(new Date(ano, mes + delta, 1))

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-brand-deep capitalize">
          {MESES[mes]} <span className="text-brand-deep/40 font-semibold">{ano}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => passarMes(-1)}
            className="w-7 h-7 grid place-items-center rounded-lg text-brand-deep/60 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMesRef(new Date(hoje.getFullYear(), hoje.getMonth(), 1))}
            className="text-[11px] font-semibold text-brand-deep/50 px-2 py-1 rounded-lg hover:bg-brand-primary/10 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => passarMes(1)}
            className="w-7 h-7 grid place-items-center rounded-lg text-brand-deep/60 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
            aria-label="Mês seguinte"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-brand-divider/60 rounded-xl overflow-hidden border border-brand-divider/60">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="bg-brand-bg px-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-brand-deep/40">
            {d}
          </div>
        ))}
        {dias.map((d, i) => {
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          const itens = porDia[iso] ?? []
          const foraDoMes = d.getMonth() !== mes
          const eHoje = d.getTime() === hoje.getTime()
          const selecionado = diaSelecionado === iso

          const celula = (
            <>
              <span
                className={`text-[11px] font-semibold tabular-nums ${
                  eHoje ? 'text-brand-accent' : foraDoMes ? 'text-brand-deep/25' : 'text-brand-deep/70'
                }`}
              >
                {d.getDate()}
              </span>
              <span className="flex flex-wrap gap-0.5 justify-center mt-0.5 min-h-[6px]">
                {/* Um ponto por plataforma com conteúdo no dia */}
                {[...new Set(itens.map((c) => c.plataforma))].map((p) => (
                  <span key={p} className={`w-1.5 h-1.5 rounded-full ${CORES_PLATAFORMA[p]?.dot ?? 'bg-brand-accent'}`} />
                ))}
              </span>
            </>
          )

          const classes = `min-h-[52px] sm:min-h-[60px] p-1.5 flex flex-col items-center transition-colors ${
            selecionado ? 'bg-brand-accent/15 ring-1 ring-inset ring-brand-accent/50' : itens.length ? 'bg-brand-bg hover:bg-brand-primary/[0.06]' : 'bg-brand-bg'
          } ${foraDoMes ? 'opacity-45' : ''}`

          return itens.length || selecionado ? (
            <button
              key={i}
              onClick={() => onSelecionarDia?.(selecionado ? null : iso)}
              className={`text-left cursor-pointer ${classes}`}
              title={itens.map((c) => `${rotuloPlataforma(c.plataforma)}: ${c.titulo}`).join('\n')}
            >
              {celula}
            </button>
          ) : (
            <div key={i} className={classes}>{celula}</div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {Object.entries(CORES_PLATAFORMA).map(([p, { dot, label }]) => (
          <span key={p} className="flex items-center gap-1.5 text-[11px] text-brand-deep/55">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
