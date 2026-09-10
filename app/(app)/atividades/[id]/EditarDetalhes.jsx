'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Save, X } from 'lucide-react'
import { atualizarAtividade } from '../actions'

/**
 * Editar detalhes de uma atividade/evento/entrevista (só coordenação):
 * título, descrição, prazo, local, materiais, orçamento e público.
 * Vive no cabeçalho da página de detalhe, colado às meta-informações.
 */
export default function EditarDetalhes({ atividade }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState(atividade.titulo)
  const [descricao, setDescricao] = useState(atividade.descricao || '')
  const [prazo, setPrazo] = useState(() => {
    if (!atividade.prazo) return ''
    const d = new Date(atividade.prazo)
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [local, setLocal] = useState(atividade.local || '')
  const [materiais, setMateriais] = useState(atividade.materiais || '')
  const [orcamento, setOrcamento] = useState(
    atividade.orcamento != null ? String(atividade.orcamento) : ''
  )
  const [publicoAlvo, setPublicoAlvo] = useState(atividade.publico_alvo || '')
  const [publicoEsperado, setPublicoEsperado] = useState(
    atividade.publico_esperado != null ? String(atividade.publico_esperado) : ''
  )
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState(null)

  async function guardar(e) {
    e.preventDefault()
    setErro(null)
    setAGuardar(true)
    try {
      const r = await atualizarAtividade(atividade.id, {
        titulo,
        descricao,
        prazo,
        local,
        materiais,
        orcamento: orcamento === '' ? null : orcamento,
        publico_alvo: publicoAlvo,
        publico_esperado: publicoEsperado === '' ? null : publicoEsperado,
      })
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
        <h2 className="text-sm font-bold text-brand-deep">Editar detalhes</h2>
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
        <label className="form-label" htmlFor="ea-titulo">Título</label>
        <input
          id="ea-titulo"
          className="form-input"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="ea-descricao">Descrição</label>
        <textarea
          id="ea-descricao"
          className="form-textarea"
          placeholder="Contexto, objetivos, notas…"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="ea-prazo">Prazo (opcional)</label>
        <input
          id="ea-prazo"
          type="datetime-local"
          className="form-input"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="ea-local">Local (opcional)</label>
        <input
          id="ea-local"
          className="form-input"
          placeholder="Sala, endereço ou link da videochamada"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
      </div>

      <div className="form-group">
        <span className="form-label">
          Materiais necessários <span className="text-brand-deep/40 font-normal">(um por linha)</span>
        </span>
        <textarea
          id="ea-materiais"
          className="form-textarea"
          rows={3}
          placeholder={'Ex.:\nTensiómetros × 4\nÁlcool e algodão'}
          value={materiais}
          onChange={(e) => setMateriais(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label" htmlFor="ea-orcamento">
            Orçamento estimado <span className="text-brand-deep/40 font-normal">(KZ)</span>
          </label>
          <input
            id="ea-orcamento"
            type="number"
            min="0"
            step="0.01"
            className="form-input"
            value={orcamento}
            onChange={(e) => setOrcamento(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ea-esperado">Participantes esperados</label>
          <input
            id="ea-esperado"
            type="number"
            min="0"
            className="form-input"
            value={publicoEsperado}
            onChange={(e) => setPublicoEsperado(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="ea-alvo">Público-alvo (opcional)</label>
        <input
          id="ea-alvo"
          className="form-input"
          placeholder="Ex.: Residentes do bairro Polana Caniço"
          value={publicoAlvo}
          onChange={(e) => setPublicoAlvo(e.target.value)}
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
        <button type="button" onClick={() => setAberto(false)} className="btn btn-small btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  )
}
