'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { criarReuniao } from '../actions'

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

/** Próxima data pela regra — espelha a lógica das actions, para pré-preencher. */
function proximaDataRegra(config, aPartirDe = new Date()) {
  const [h, m] = (config.hora || '18:00').split(':').map(Number)
  if (config.dia_do_mes) {
    const d = new Date(aPartirDe.getFullYear(), aPartirDe.getMonth(), config.dia_do_mes, h, m || 0)
    if (d <= aPartirDe) d.setMonth(d.getMonth() + 1)
    return d
  }
  const alvo = config.dia_semana ?? 1
  const ano = aPartirDe.getFullYear()
  let mes = aPartirDe.getMonth()
  for (let tent = 0; tent < 3; tent++) {
    const primeiro = new Date(ano, mes, 1, h, m || 0)
    const desvio = (alvo - primeiro.getDay() + 7) % 7
    const d = new Date(ano, mes, 1 + desvio + 7 * ((config.semana_do_mes ?? 1) - 1), h, m || 0)
    if (d.getMonth() === mes && d > aPartirDe) return d
    mes++
  }
  return null
}

export default function FormNovaReuniao({ equipa, pessoaAtualId, config }) {
  const router = useRouter()
  const [tipo, setTipo] = useState('mensal')
  const [titulo, setTitulo] = useState('')
  const [dataHora, setDataHora] = useState(() => {
    const d = config?.ativa ? proximaDataRegra(config) : null
    if (!d) return ''
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [local, setLocal] = useState(config?.local || '')
  const [pauta, setPauta] = useState('')
  const [participantes, setParticipantes] = useState(equipa.map((p) => p.id))
  const [aCarregar, setACarregar] = useState(false)
  const [erro, setErro] = useState(null)

  const sugestaoTitulo = useMemo(() => {
    if (!dataHora) return ''
    const d = new Date(dataHora)
    return tipo === 'urgente'
      ? 'Reunião urgente'
      : `Reunião mensal — ${d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`
  }, [dataHora, tipo])

  function alternarPessoa(id) {
    setParticipantes((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    )
  }

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setACarregar(true)
    try {
      const r = await criarReuniao({
        titulo: titulo.trim() || sugestaoTitulo,
        tipo,
        dataHora,
        local,
        pauta,
        participantes,
      })
      if (!r.ok) {
        setErro(r.erro || 'Não foi possível criar a reunião.')
        return
      }
      router.push(`/reunioes/${r.id}`)
    } finally {
      setACarregar(false)
    }
  }

  return (
    <form onSubmit={submeter} className="space-y-6">
      <div className="form-group">
        <span className="form-label">Tipo</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {[
            { v: 'mensal', l: 'Mensal' },
            { v: 'urgente', l: 'Urgente' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setTipo(o.v)}
              className={`filter-btn ${tipo === o.v ? 'active' : ''}`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="titulo">
          Título <span className="text-brand-deep/40 font-normal">(vazio = sugestão automática)</span>
        </label>
        <input
          id="titulo"
          className="form-input"
          placeholder={sugestaoTitulo || 'Ex.: Reunião urgente — corpo diretivo'}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label" htmlFor="datahora">Data e hora</label>
          <input
            id="datahora"
            type="datetime-local"
            className="form-input"
            required
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
          />
          {tipo === 'mensal' && config?.ativa && (
            <p className="text-xs text-brand-deep/45 mt-1.5">
              Pré-preenchido com a próxima data da regra mensal configurada.
            </p>
          )}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="local">Local (opcional)</label>
          <input
            id="local"
            className="form-input"
            placeholder="Sala / videochamada"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="pauta">
          Pauta <span className="text-brand-deep/40 font-normal">(um ponto por linha)</span>
        </label>
        <textarea
          id="pauta"
          className="form-textarea"
          rows={4}
          placeholder={'1. Ponto da situação\n2. Aprovação de planos\n3. Assuntos diversos'}
          value={pauta}
          onChange={(e) => setPauta(e.target.value)}
        />
      </div>

      <div className="form-group">
        <span className="form-label">Convocados</span>
        <p className="text-xs text-brand-deep/50 mt-0.5 mb-2">
          Todos selecionados por defeito — os convocados confirmam presença na secção Reuniões.
        </p>
        <div className="flex flex-wrap gap-2">
          {equipa.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => alternarPessoa(p.id)}
              className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                participantes.includes(p.id)
                  ? 'border-brand-accent bg-brand-accent/10 text-brand-accent font-semibold'
                  : 'border-brand-divider text-brand-deep/60 hover:border-brand-accent/50'
              }`}
            >
              {p.nome}
              {p.id === pessoaAtualId && ' (tu)'}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {erro}
        </p>
      )}

      <button type="submit" disabled={aCarregar} className="btn btn-primary">
        {aCarregar ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        {aCarregar ? 'A convocar…' : 'Convocar reunião'}
      </button>
    </form>
  )
}
