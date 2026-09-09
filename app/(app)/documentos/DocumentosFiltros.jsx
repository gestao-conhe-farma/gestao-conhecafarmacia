'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

export default function DocumentosFiltros({ categorias, categoriaAtual, busca }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [texto, setTexto] = useState(busca)

  function navegar({ cat, q }) {
    const p = new URLSearchParams(params.toString())
    if (cat) p.set('cat', cat)
    else p.delete('cat')
    if (q) p.set('q', q)
    else p.delete('q')
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="mb-2">
      {/* Pesquisa — campo limpo, sem cartão à volta */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          navegar({ q: texto.trim(), cat: categoriaAtual })
        }}
        className="relative max-w-md"
      >
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-deep/40"
        />
        <input
          className="form-input pl-10 pr-9"
          placeholder="Pesquisar por título, código ou descrição…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Pesquisar documentos"
        />
        {texto && (
          <button
            type="button"
            onClick={() => {
              setTexto('')
              navegar({ q: '', cat: categoriaAtual })
            }}
            aria-label="Limpar pesquisa"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-deep/40 hover:text-brand-deep"
          >
            <X size={15} />
          </button>
        )}
      </form>

      {/* Categorias: tabs sublinhadas com scroll horizontal no mobile */}
      <div
        className="flex gap-1 overflow-x-auto border-b border-brand-divider mt-5 -mx-6 px-6 md:mx-0 md:px-0"
        role="tablist"
        aria-label="Filtrar por categoria"
      >
        <button
          onClick={() => navegar({ cat: '', q: busca })}
          aria-selected={!categoriaAtual}
          className={`filter-btn shrink-0 ${!categoriaAtual ? 'active' : ''}`}
        >
          Todas
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => navegar({ cat: c.id, q: busca })}
            aria-selected={categoriaAtual === c.id}
            className={`filter-btn shrink-0 ${categoriaAtual === c.id ? 'active' : ''}`}
          >
            {c.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
