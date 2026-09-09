'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const ABAS = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'atividade', label: 'Atividades' },
  { valor: 'evento', label: 'Eventos' },
  { valor: 'entrevista', label: 'Entrevistas' },
]

export default function AbasTipo({ atual }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function escolher(valor) {
    const p = new URLSearchParams(params.toString())
    if (valor === 'todas') {
      p.delete('tipo')
    } else {
      p.set('tipo', valor)
    }
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtrar por tipo">
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
