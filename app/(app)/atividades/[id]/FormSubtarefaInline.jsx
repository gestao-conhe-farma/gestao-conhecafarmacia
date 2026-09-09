'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { criarSubtarefa } from '../subtarefas-actions'

export default function FormSubtarefaInline({ atividadeId, equipa }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [responsaveis, setResponsaveis] = useState([])
  const [aCarregar, setACarregar] = useState(false)
  const [erro, setErro] = useState(null)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setACarregar(true)
    try {
      const r = await criarSubtarefa({
        atividadeId,
        titulo,
        descricao,
        prazo: prazo || null,
        responsaveis,
      })
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setTitulo('')
      setDescricao('')
      setPrazo('')
      setResponsaveis([])
      setAberto(false)
      router.refresh()
    } finally {
      setACarregar(false)
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="btn btn-secondary">
        <Plus size={16} />
        Adicionar subtarefa
      </button>
    )
  }

  return (
    <form onSubmit={submeter} className="space-y-4">
      <div className="form-group">
        <label className="form-label">Título</label>
        <input
          className="form-input"
          required
          autoFocus
          placeholder="Ex.: Preparar lista de material"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Descrição (opcional)</label>
        <textarea
          className="form-textarea"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Prazo (opcional)</label>
          <input
            type="datetime-local"
            className="form-input"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
        </div>
        <div className="form-group">
          <span className="form-label">Responsáveis</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {equipa.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  setResponsaveis((atual) =>
                    atual.includes(p.id)
                      ? atual.filter((x) => x !== p.id)
                      : [...atual, p.id]
                  )
                }
                className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                  responsaveis.includes(p.id)
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent font-semibold'
                    : 'border-brand-divider text-brand-deep/60 hover:border-brand-accent/50'
                }`}
              >
                {p.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={aCarregar} className="btn btn-primary btn-small">
          {aCarregar ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
          {aCarregar ? 'A criar…' : 'Criar subtarefa'}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="btn btn-secondary btn-small">
          Cancelar
        </button>
      </div>
    </form>
  )
}
