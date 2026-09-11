'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Save } from 'lucide-react'
import { criarSubtarefa, editarSubtarefa } from '../subtarefas-actions'

/**
 * Formulário de subtarefa, em dois modos:
 * - criação (fechado até clicar "Adicionar subtarefa")
 * - edição (recebe `subtarefa` e parte já aberto, com dados preenchidos)
 */
export default function FormSubtarefaInline({ atividadeId, equipa, subtarefa = null, aoTerminar }) {
  const emEdicao = Boolean(subtarefa)
  const router = useRouter()
  const [aberto, setAberto] = useState(emEdicao)
  const [titulo, setTitulo] = useState(subtarefa?.titulo ?? '')
  const [descricao, setDescricao] = useState(subtarefa?.descricao ?? '')
  const [prazo, setPrazo] = useState(() => {
    if (!subtarefa?.prazo) return ''
    const d = new Date(subtarefa.prazo)
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [responsaveis, setResponsaveis] = useState(
    subtarefa?.subtarefa_responsaveis?.map((r) => r.pessoa_id) ?? []
  )
  const [aCarregar, setACarregar] = useState(false)
  const [erro, setErro] = useState(null)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setACarregar(true)
    try {
      const r = emEdicao
        ? await editarSubtarefa(subtarefa.id, {
            titulo,
            descricao,
            prazo: prazo || null,
            responsaveis,
          })
        : await criarSubtarefa({
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
      if (!emEdicao) {
        setTitulo('')
        setDescricao('')
        setPrazo('')
        setResponsaveis([])
        setAberto(false)
      }
      aoTerminar?.()
      router.refresh()
    } finally {
      setACarregar(false)
    }
  }

  // Modo criação: fechado até pedir
  if (!emEdicao && !aberto) {
    return (
      <button onClick={() => setAberto(true)} className="btn btn-secondary">
        <Plus size={16} />
        Adicionar subtarefa
      </button>
    )
  }

  return (
    <form onSubmit={submeter} className={emEdicao ? 'w-full space-y-4' : 'space-y-4'}>
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
                className={`chip-btn ${
                  responsaveis.includes(p.id)
                    ? 'chip-btn-on'
                    : 'chip-btn-off'
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
          {aCarregar ? <Loader2 className="animate-spin" size={15} /> : emEdicao ? <Save size={15} /> : <Plus size={15} />}
          {aCarregar ? 'A guardar…' : emEdicao ? 'Guardar alterações' : 'Criar subtarefa'}
        </button>
        <button
          type="button"
          onClick={() => (emEdicao ? aoTerminar?.() : setAberto(false))}
          className="btn btn-secondary btn-small"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
