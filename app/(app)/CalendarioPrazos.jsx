'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * CalendarioPrazos — mini-calendário mensal do dashboard com os prazos de
 * conclusão de atividades (e subtarefas) marcados. Verde como cor de
 * destaque: hoje com anel verde, dias com prazos levam pontos verdes
 * (abertos) ou esbatidos (concluídos). Clicar num dia com itens mostra
 * a lista; navegação de mês limitada a ±6 meses.
 *
 * `largo` (usado no dashboard): grelha à esquerda e lista do dia à direita.
 */
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const ROTULO_TIPO = {
  atividade: 'Atividade',
  evento: 'Evento',
  entrevista: 'Entrevista',
  subtarefa: 'Tarefa',
  reuniao: 'Reunião',
}

function chaveDia(d) {
  const a = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${a}-${m}-${dd}`
}

export default function CalendarioPrazos({ eventos, largo = false }) {
  const hoje = useMemo(() => new Date(), [])
  const [mesRef, setMesRef] = useState(
    () => new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  )
  const [diaSelecionado, setDiaSelecionado] = useState(() => chaveDia(hoje))

  // eventos: [{ id, titulo, tipo, prazo, status, href }] — agrupados por dia
  const porDia = useMemo(() => {
    const mapa = new Map()
    for (const e of eventos) {
      if (!e.prazo) continue
      const chave = chaveDia(new Date(e.prazo))
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave).push(e)
    }
    return mapa
  }, [eventos])

  const { semanas, rotulo } = useMemo(() => {
    const ano = mesRef.getFullYear()
    const mes = mesRef.getMonth()
    const bruto = mesRef.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
    const rotulo = bruto.charAt(0).toUpperCase() + bruto.slice(1)

    const deslocamento = (new Date(ano, mes, 1).getDay() + 6) % 7 // semana começa segunda
    const inicio = new Date(ano, mes, 1 - deslocamento)

    const celulas = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio)
      d.setDate(inicio.getDate() + i)
      celulas.push({
        chave: chaveDia(d),
        dia: d.getDate(),
        noMes: d.getMonth() === mes,
        idUnico: `${chaveDia(d)}-${i}`,
      })
    }
    const semanas = []
    for (let i = 0; i < 6; i++) semanas.push(celulas.slice(i * 7, i * 7 + 7))
    return { semanas, rotulo }
  }, [mesRef])

  const limite = useMemo(
    () => ({
      antes: new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1),
      depois: new Date(hoje.getFullYear(), hoje.getMonth() + 6, 1),
    }),
    [hoje]
  )
  const podeAnterior = mesRef > limite.antes
  const podeSeguinte = mesRef < limite.depois

  const itensDoDia = porDia.get(diaSelecionado) ?? []
  const totalDoMes = semanas
    .flat()
    .filter((c) => c.noMes && (porDia.get(c.chave)?.length ?? 0) > 0).length

  return (
    <div
      className={`card p-6 ${
        largo
          ? 'lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-8'
          : ''
      }`}
    >
      {/* Coluna esquerda: cabeçalho + grelha do mês */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="text-base font-bold text-brand-deep">
            <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">
              04
            </span>
            Calendário de prazos
          </h3>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() =>
                podeAnterior &&
                setMesRef(new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1))
              }
              disabled={!podeAnterior}
              aria-label="Mês anterior"
              className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/55 hover:text-brand-primary hover:bg-brand-primary/5 disabled:opacity-25 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-brand-deep min-w-[118px] text-center tabular-nums">
              {rotulo}
            </span>
            <button
              onClick={() =>
                podeSeguinte &&
                setMesRef(new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1))
              }
              disabled={!podeSeguinte}
              aria-label="Mês seguinte"
              className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/55 hover:text-brand-primary hover:bg-brand-primary/5 disabled:opacity-25 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7" role="grid" aria-label={`Prazos em ${rotulo}`}>
          {DIAS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold tracking-[0.1em] uppercase text-brand-deep/35 py-1.5"
              aria-hidden="true"
            >
              {d}
            </div>
          ))}
          {semanas.flat().map((c) => {
            const itens = porDia.get(c.chave) ?? []
            const abertos = itens.filter((e) => e.status !== 'concluida')
            const ehHoje = c.chave === chaveDia(hoje)
            const selecionado = c.chave === diaSelecionado
            const clicavel = itens.length > 0

            return (
              <div key={c.idUnico} className="grid place-items-center py-[2px]">
                <button
                  type="button"
                  onClick={() => clicavel && setDiaSelecionado(c.chave)}
                  disabled={!clicavel}
                  aria-label={
                    clicavel
                      ? `${c.dia}: ${itens.length} prazo${itens.length > 1 ? 's' : ''}`
                      : undefined
                  }
                  aria-pressed={selecionado && clicavel}
                  className={`relative w-9 h-9 grid place-items-center rounded-lg text-[12.5px] tabular-nums transition-colors
                    ${c.noMes ? 'text-brand-deep' : 'text-brand-deep/25'}
                    ${ehHoje ? 'ring-2 ring-brand-accent/70 font-bold' : ''}
                    ${selecionado && clicavel ? 'bg-brand-accent/15 font-bold' : ''}
                    ${!selecionado && clicavel ? 'hover:bg-brand-accent/10 font-semibold' : ''}
                    ${clicavel ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {c.dia}
                  {itens.length > 0 && (
                    <span className="absolute bottom-[3px] flex gap-[2px]" aria-hidden="true">
                      {abertos.length > 0 && (
                        <span className="w-1 h-1 rounded-full bg-brand-accent" />
                      )}
                      {abertos.length < itens.length && (
                        <span className="w-1 h-1 rounded-full bg-brand-accent/35" />
                      )}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Legenda discreta */}
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-brand-deep/40">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" /> prazo a cumprir
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent/35" /> concluído
          </span>
          {totalDoMes > 0 && (
            <span className="tabular-nums">
              {totalDoMes} dia{totalDoMes > 1 ? 's' : ''} com prazos este mês
            </span>
          )}
        </p>
      </div>

      {/* Coluna direita (ou rodapé no modo estreito): lista do dia selecionado */}
      <div
        className={`min-w-0 min-h-[64px] ${
          largo
            ? 'mt-4 lg:mt-0 lg:pt-[52px] lg:pl-8 lg:border-l border-brand-divider/70 border-t lg:border-t-0 pt-4'
            : 'mt-4 pt-4 border-t border-brand-divider/70'
        }`}
      >
        {itensDoDia.length === 0 ? (
          <p className="text-xs text-brand-deep/45 py-3">
            {diaSelecionado === chaveDia(hoje)
              ? 'Sem prazos para hoje.'
              : 'Sem prazos neste dia — clica num dia com ponto verde.'}
          </p>
        ) : (
          <ul className="divide-y divide-brand-divider/60">
            {itensDoDia.map((e) => (
              <li key={e.id} className="py-2.5 flex items-center gap-3">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    e.status === 'concluida' ? 'bg-brand-accent/40' : 'bg-brand-accent'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={e.href}
                    className="text-[13px] font-semibold text-brand-deep hover:text-brand-primary transition-colors truncate block"
                  >
                    {e.titulo}
                  </Link>
                  <p className="text-[11px] text-brand-deep/50">
                    {ROTULO_TIPO[e.tipo] ?? 'Prazo'}
                  </p>
                </div>
                {e.status === 'concluida' && (
                  <span className="badge badge-status-concluida">Concluída</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
