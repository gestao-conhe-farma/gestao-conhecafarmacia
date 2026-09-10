'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { gerarReunioesMensais, guardarConfiguracaoReunioes } from './actions'

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]
const ORDINAIS = ['1.ª', '2.ª', '3.ª', '4.ª']

export default function PainelRecorrencia({ config }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [ativa, setAtiva] = useState(config?.ativa ?? true)
  const [modo, setModo] = useState(config?.dia_do_mes ? 'dia' : 'semana')
  const [semanaDoMes, setSemanaDoMes] = useState(config?.semana_do_mes ?? 1)
  const [diaSemana, setDiaSemana] = useState(config?.dia_semana ?? 1)
  const [diaDoMes, setDiaDoMes] = useState(config?.dia_do_mes ?? 1)
  const [hora, setHora] = useState((config?.hora || '18:00').slice(0, 5))
  const [local, setLocal] = useState(config?.local || '')
  const [aGuardar, setAGuardar] = useState(false)
  const [aGerar, setAGerar] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  async function guardar(e) {
    e.preventDefault()
    setMensagem(null)
    setAGuardar(true)
    try {
      const r = await guardarConfiguracaoReunioes({
        ativa,
        modo,
        semanaDoMes,
        diaSemana,
        diaDoMes,
        hora,
        local,
      })
      setMensagem(r.ok ? { tipo: 'ok', txt: 'Regra guardada.' } : { tipo: 'erro', txt: r.erro })
      if (r.ok) router.refresh()
    } finally {
      setAGuardar(false)
    }
  }

  async function gerar() {
    setMensagem(null)
    setAGerar(true)
    try {
      const r = await gerarReunioesMensais()
      setMensagem(
        r.ok
          ? { tipo: 'ok', txt: r.criadas ? `${r.criadas} reunião(ões) gerada(s).` : 'Nada a gerar — as próximas já existem.' }
          : { tipo: 'erro', txt: r.erro }
      )
      if (r.ok) router.refresh()
    } finally {
      setAGerar(false)
    }
  }

  function descreverRegra() {
    if (!config?.ativa) return 'Recorrência desativada'
    if (config.dia_do_mes)
      return `Dia ${config.dia_do_mes} de cada mês às ${config.hora?.slice(0, 5)}`
    return `${ORDINAIS[config.semana_do_mes - 1]} ${DIAS_SEMANA[config.dia_semana].toLowerCase()} de cada mês às ${config.hora?.slice(0, 5)}`
  }

  return (
    <div className="card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-brand-deep">
            Reunião mensal — regra fixa
          </h3>
          <p className="text-sm text-brand-deep/55 mt-0.5">{descreverRegra()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAberto((v) => !v)} className="btn btn-small btn-ghost border border-brand-divider">
            <Settings size={14} />
            {aberto ? 'Fechar' : 'Editar regra'}
          </button>
          <button onClick={gerar} disabled={aGerar} className="btn btn-small btn-accent">
            {aGerar ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Gerar próximas
          </button>
        </div>
      </div>

      {aberto && (
        <form onSubmit={guardar} className="mt-6 pt-5 border-t border-brand-divider space-y-5">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-brand-accent)]"
            />
            <span className="text-sm font-semibold text-brand-deep">
              Recorrência mensal ativa
            </span>
          </label>

          {ativa && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <span className="form-label">Padrão</span>
                  <div className="flex gap-2 mt-1">
                    {[
                      { v: 'semana', l: 'Semana do mês' },
                      { v: 'dia', l: 'Dia fixo' },
                    ].map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setModo(o.v)}
                        className={`filter-btn text-[13px] ${modo === o.v ? 'active' : ''}`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {modo === 'semana' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="semana">Semana</label>
                      <select
                        id="semana"
                        className="form-select"
                        value={semanaDoMes}
                        onChange={(e) => setSemanaDoMes(Number(e.target.value))}
                      >
                        {ORDINAIS.map((o, i) => (
                          <option key={o} value={i + 1}>{o} semana</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="diasem">Dia da semana</label>
                      <select
                        id="diasem"
                        className="form-select"
                        value={diaSemana}
                        onChange={(e) => setDiaSemana(Number(e.target.value))}
                      >
                        {DIAS_SEMANA.map((d, i) => (
                          <option key={d} value={i}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="diames">Dia do mês</label>
                    <input
                      id="diames"
                      type="number"
                      min="1"
                      max="31"
                      className="form-input"
                      value={diaDoMes}
                      onChange={(e) => setDiaDoMes(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="hora">Hora</label>
                  <input
                    id="hora"
                    type="time"
                    className="form-input"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="local">Local (opcional)</label>
                  <input
                    id="local"
                    className="form-input"
                    placeholder="Ex.: Sala da farmácia / videochamada"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {mensagem && (
            <p
              className={`text-sm rounded-lg px-4 py-3 border ${
                mensagem.tipo === 'ok'
                  ? 'text-brand-accent bg-brand-accent/10 border-brand-accent/20'
                  : 'text-red-600 bg-red-500/10 border-red-500/20'
              }`}
            >
              {mensagem.txt}
            </p>
          )}

          <button type="submit" disabled={aGuardar} className="btn btn-primary">
            {aGuardar && <Loader2 size={16} className="animate-spin" />}
            Guardar regra
          </button>
        </form>
      )}
    </div>
  )
}
