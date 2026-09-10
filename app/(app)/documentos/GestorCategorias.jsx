'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Pencil, Trash2, X, Plus } from 'lucide-react'
import { criarCategoria, renomearCategoria, eliminarCategoria } from './actions'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

export default function GestorCategorias({ categorias }) {
  const router = useRouter()
  const [aCriar, setACriar] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [emEdicao, setEmEdicao] = useState(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [aProcessar, setAProcessar] = useState(false)
  const [erro, setErro] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

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
    const ok = await pedirConfirmacao({
      titulo: `Eliminar a categoria “${nome}”?`,
      descricao: 'As categorias com documentos associados não podem ser eliminadas.',
      confirmarTxt: 'Eliminar',
      perigoso: true,
    })
    if (!ok) return
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
    <div className="mt-6 pt-5 border-t border-dashed border-brand-divider">
      {/* Linha de gestão: criar + chips editáveis */}
      <form onSubmit={criar} className="flex gap-2 max-w-md">
        <input
          className="form-input flex-1 !py-2 text-sm"
          placeholder="Nome da nova categoria…"
          aria-label="Nome da nova categoria"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button
          type="submit"
          disabled={aCriar || novoNome.trim().length < 2}
          className="btn btn-secondary btn-small shrink-0"
        >
          {aCriar ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
          Nova
        </button>
      </form>

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mt-3 max-w-md">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-deep/40 mr-2">
          Gerir:
        </span>
        {categorias.map((c) =>
          emEdicao === c.id ? (
            <span key={c.id} className="flex items-center gap-1">
              <input
                className="form-input !w-auto !py-1 !px-2.5 text-sm"
                value={nomeEdicao}
                autoFocus
                size={Math.max(8, nomeEdicao.length)}
                aria-label="Novo nome da categoria"
                onChange={(e) => setNomeEdicao(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renomear(c.id)
                  if (e.key === 'Escape') setEmEdicao(null)
                }}
              />
              <button
                onClick={() => renomear(c.id)}
                disabled={aProcessar}
                aria-label="Guardar"
                className="w-7 h-7 grid place-items-center rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition-colors"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setEmEdicao(null)}
                aria-label="Cancelar"
                className="w-7 h-7 grid place-items-center rounded-lg text-brand-deep/50 hover:bg-brand-primary/5"
              >
                <X size={14} />
              </button>
            </span>
          ) : (
            <span
              key={c.id}
              className="group flex items-center gap-0.5 pl-3 pr-1.5 py-1 rounded-full border border-brand-divider hover:border-brand-accent/50 transition-colors"
            >
              <span className="text-[13px] text-brand-deep/75">{c.nome}</span>
              <button
                onClick={() => {
                  setEmEdicao(c.id)
                  setNomeEdicao(c.nome)
                }}
                aria-label={`Renomear ${c.nome}`}
                className="w-6 h-6 grid place-items-center rounded-full text-brand-deep/30 hover:text-brand-primary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => eliminar(c.id, c.nome)}
                aria-label={`Eliminar ${c.nome}`}
                className="w-6 h-6 grid place-items-center rounded-full text-brand-deep/30 hover:text-red-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </span>
          )
        )}
      </div>

      {caixaConfirmacao}
    </div>
  )
}
