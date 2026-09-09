'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FolderPlus, Loader2, Pencil, Trash2, X, ChevronDown } from 'lucide-react'
import { criarCategoria, renomearCategoria, eliminarCategoria } from './actions'

export default function GestorCategorias({ categorias }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [aCriar, setACriar] = useState(false)
  const [emEdicao, setEmEdicao] = useState(null) // id em renomeação
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [aProcessar, setAProcessar] = useState(false)
  const [erro, setErro] = useState(null)

  async function criar(e) {
    e.preventDefault()
    setErro(null)
    setACriar(true)
    try {
      const r = await criarCategoria(novoNome)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setNovoNome('')
      router.refresh()
    } finally {
      setACriar(false)
    }
  }

  async function renomear(id) {
    setErro(null)
    setAProcessar(true)
    try {
      const r = await renomearCategoria(id, nomeEdicao)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setEmEdicao(null)
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  async function eliminar(id, nome) {
    if (!confirm(`Eliminar a categoria “${nome}”?`)) return
    setErro(null)
    setAProcessar(true)
    try {
      const r = await eliminarCategoria(id)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-brand-deep/70 hover:text-brand-deep transition-colors"
      >
        <span className="flex items-center gap-2">
          <FolderPlus size={16} className="text-brand-accent" />
          Gerir categorias
        </span>
        <ChevronDown size={16} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="px-5 pb-5 pt-1 border-t border-brand-divider/60">
          {/* Nova categoria */}
          <form onSubmit={criar} className="flex gap-2 mt-4">
            <input
              className="form-input flex-1"
              placeholder="Nome da nova categoria…"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
            <button type="submit" disabled={aCriar || novoNome.trim().length < 2} className="btn btn-primary btn-small">
              {aCriar ? <Loader2 className="animate-spin" size={15} /> : <FolderPlus size={15} />}
              Criar
            </button>
          </form>

          {erro && (
            <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mt-3">
              {erro}
            </p>
          )}

          {/* Lista */}
          <ul className="mt-4 space-y-1.5">
            {categorias.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                {emEdicao === c.id ? (
                  <>
                    <input
                      className="form-input flex-1 !py-1.5 text-sm"
                      value={nomeEdicao}
                      autoFocus
                      onChange={(e) => setNomeEdicao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renomear(c.id)
                        if (e.key === 'Escape') setEmEdicao(null)
                      }}
                    />
                    <button onClick={() => renomear(c.id)} disabled={aProcessar} aria-label="Guardar" className="w-8 h-8 grid place-items-center rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition-colors">
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEmEdicao(null)} aria-label="Cancelar" className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/50 hover:bg-brand-primary/5">
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-brand-deep py-1">{c.nome}</span>
                    <button
                      onClick={() => {
                        setEmEdicao(c.id)
                        setNomeEdicao(c.nome)
                      }}
                      aria-label={`Renomear ${c.nome}`}
                      className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/50 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => eliminar(c.id, c.nome)}
                      aria-label={`Eliminar ${c.nome}`}
                      className="w-8 h-8 grid place-items-center rounded-lg text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
