'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

/**
 * Abas de visibilidade nas Reuniões — só para a coordenação.
 * Permite separar visualmente as reuniões privadas (só coordenação)
 * das reuniões abertas a toda a equipa. O filtro vive no URL (?vis=),
 * como nas abas de tipo das Atividades.
 */
const ABAS = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'equipa', label: 'Toda a equipa' },
  { valor: 'coordenacao', label: 'Só coordenação' },
]

export default function AbasVisibilidade({ atual }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function escolher(valor) {
    const p = new URLSearchParams(params.toString())
    if (valor === 'todas') {
      p.delete('vis')
    } else {
      p.set('vis', valor)
    }
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtrar por visibilidade">
      {ABAS.map(({ valor, label }) => (
        <button
          key={valor}
          role="tab"
          aria-selected={atual === valor}
          onClick={() => escolher(valor)}
          className={`filter-btn ${atual === valor ? 'active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
