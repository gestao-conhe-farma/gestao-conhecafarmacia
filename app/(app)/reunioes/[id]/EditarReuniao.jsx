'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Save, X } from 'lucide-react'
import { editarReuniao } from '../actions'

/**
 * Editar os detalhes de uma reunião agendada (título, tipo, data/hora,
 * local e pauta) — só coordenação. Vive no cabeçalho da página da
 * reunião, colado às meta-informações.
 */
export default function EditarReuniao({ reuniao }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState(reuniao.titulo)
  const [tipo, setTipo] = useState(reuniao.tipo)
  const [dataHora, setDataHora] = useState(() => {
    const d = new Date(reuniao.data_hora)
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [local, setLocal] = useState(reuniao.local || '')
  const [pauta, setPauta] = useState(reuniao.pauta || '')
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState(null)

  async function guardar(e) {
    e.preventDefault()
    setErro(null)
    setAGuardar(true)
    try {
      const r = await editarReuniao(reuniao.id, { titulo, tipo, dataHora, local, pauta })
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setAberto(false)
      router.refresh()
    } finally {
      setAGuardar(false)
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-deep/50 hover:text-brand-primary transition-colors"
      >
        <Pencil size={13} />
        Editar detalhes
      </button>
    )
  }

  return (
    <form onSubmit={guardar} className="card p-5 md:p-6 space-y-4 mt-2 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-brand-deep">Editar reunião</h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar edição"
          className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/50 hover:text-brand-deep hover:bg-brand-bg-alt transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="er-titulo">Título</label>
        <input
          id="er-titulo"
          className="form-input"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label" htmlFor="er-data">Data e hora</label>
          <input
            id="er-data"
            type="datetime-local"
            className="form-input"
            required
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="er-local">Local (opcional)</label>
          <input
            id="er-local"
            className="form-input"
            placeholder="Sala / videochamada"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="er-pauta">
          Pauta <span className="text-brand-deep/40 font-normal">(um ponto por linha)</span>
        </label>
        <textarea
          id="er-pauta"
          className="form-textarea"
          rows={4}
          value={pauta}
          onChange={(e) => setPauta(e.target.value)}
        />
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={aGuardar} className="btn btn-primary btn-small">
          {aGuardar ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {aGuardar ? 'A guardar…' : 'Guardar alterações'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="btn btn-small btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
