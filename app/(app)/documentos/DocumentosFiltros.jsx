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
    <div className="card p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Pesquisa */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            navegar({ q: texto.trim(), cat: categoriaAtual })
          }}
          className="relative flex-1"
        >
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-deep/40" />
          <input
            className="form-input pl-10 pr-9"
            placeholder="Pesquisar por título, código ou descrição…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
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
      </div>

      {/* Categorias */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => navegar({ cat: '', q: busca })}
          className={`filter-btn ${!categoriaAtual ? 'active' : ''}`}
        >
          Todas
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => navegar({ cat: c.id, q: busca })}
            className={`filter-btn ${categoriaAtual === c.id ? 'active' : ''}`}
          >
            {c.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
