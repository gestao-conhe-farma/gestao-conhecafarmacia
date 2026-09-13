'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Loader2, Lock, X } from 'lucide-react'
import { sugerirFinalidade } from '@/lib/documentos'
import { editarDocumento } from './actions'
import { NotaFlutuante } from '@/components/CaixaConfirmacao'

/**
 * EditarDocumento — modal para a coordenação corrigir os metadados de
 * um documento já publicado (título, descrição, código, categoria,
 * restrito). O ficheiro em si não muda.
 */
export default function EditarDocumento({ doc, categorias, fechar }) {
  const [montado, setMontado] = useState(false)
  const [titulo, setTitulo] = useState(doc.titulo)
  const [descricao, setDescricao] = useState(doc.descricao ?? '')
  const [categoriaId, setCategoriaId] = useState(doc.categoria?.id ?? '')
  const [codigo, setCodigo] = useState(doc.codigo ?? '')
  const [restrito, setRestrito] = useState(Boolean(doc.restrito))
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    setMontado(true)
    const aoTeclar = (e) => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [fechar])

  // Re-sugere a finalidade quando código/categoria mudam — mas nunca
  // sobrescreve texto que a coordenação já escreveu.
  function sincronizarSugestao({ novoCodigo, novaCategoriaId } = {}) {
    const codigoEfetivo = novoCodigo !== undefined ? novoCodigo : codigo
    const catIdEfetivo = novaCategoriaId !== undefined ? novaCategoriaId : categoriaId
    const catNome = categorias.find((c) => c.id === catIdEfetivo)?.nome
    const sugestao = sugerirFinalidade(codigoEfetivo, catNome)
    if (sugestao && !descricao.trim()) setDescricao(sugestao)
  }

  async function guardar(e) {
    e.preventDefault()
    setErro(null)
    setAGuardar(true)
    try {
      const r = await editarDocumento(doc.id, { titulo, descricao, categoriaId, codigo, restrito })
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      fechar()
    } finally {
      setAGuardar(false)
    }
  }

  if (!montado) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/55 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Editar ${doc.titulo}`}
    >
      <form
        onSubmit={guardar}
        className="w-full max-w-lg bg-brand-card border border-brand-divider rounded-2xl shadow-md-soft p-5 md:p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="kicker">Editar documento</p>
            <p className="font-semibold text-brand-deep truncate mt-0.5">{doc.titulo}</p>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="w-9 h-9 grid place-items-center rounded-lg text-brand-deep/55 hover:text-brand-deep hover:bg-brand-primary/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ed-titulo">Título</label>
          <input
            id="ed-titulo"
            className="form-input"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="ed-cat">Categoria</label>
            <select
              id="ed-cat"
              className="form-select"
              value={categoriaId}
              onChange={(e) => {
                setCategoriaId(e.target.value)
                sincronizarSugestao({ novaCategoriaId: e.target.value })
              }}
            >
              <option value="">— Sem categoria —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ed-codigo">Código</label>
            <input
              id="ed-codigo"
              className="form-input"
              placeholder="Ex.: CF-PAT-001-2026"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value)
                sincronizarSugestao({ novoCodigo: e.target.value })
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ed-desc">Descrição — para que serve</label>
          <textarea
            id="ed-desc"
            className="form-textarea !min-h-[70px]"
            rows={2}
            placeholder="Sugerida pelo código (CF-XXX) ou categoria — edita à vontade."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-brand-divider/60 cursor-pointer hover:border-brand-accent/50 transition-colors">
          <input
            type="checkbox"
            checked={restrito}
            onChange={(e) => setRestrito(e.target.checked)}
            className="w-4 h-4 accent-[#0a844f]"
          />
          <Lock size={16} className="text-amber-600" />
          <span className="text-sm text-brand-deep">
            <strong>Restrito</strong> — visível apenas à coordenação
          </span>
        </label>

        {erro && (
          <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {erro}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={fechar} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={aGuardar} className="btn btn-primary">
            {aGuardar ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            {aGuardar ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </form>

      {aviso && <NotaFlutuante mensagem={aviso} aoFechar={() => setAviso(null)} />}
    </div>,
    document.body
  )
}
