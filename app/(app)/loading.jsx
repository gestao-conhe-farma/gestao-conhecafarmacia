import { CabecalhoSkeleton, BandaSkeleton, LinhaSkeleton } from './Skeletons'

/**
 * Loading da homepage — espelha o layout real: cabeçalho editorial,
 * banda de destaque, régua KPI de 4 colunas, secção 01 com cartões de
 * atividade e a grelha 2×2 de painéis.
 */
export default function Loading() {
  return (
    <div className="container-app" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={300} linhas={1} larguras={['55%']} />

      {/* Banda de destaque (anúncio ou próxima reunião) */}
      <BandaSkeleton />

      {/* Banda KPI com réguas verticais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-brand-divider mt-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`py-7 ${i > 0 ? 'lg:pl-7 pl-5 lg:border-l border-brand-divider' : ''} ${
              i % 2 === 1 ? 'border-l lg:border-l' : ''
            } ${i < 2 ? 'border-b lg:border-b-0 border-brand-divider' : ''}`}
          >
            <div className="skeleton h-2.5 w-16 rounded-full" />
            <div className="skeleton h-9 w-14 rounded mt-3" />
          </div>
        ))}
      </div>

      {/* Secção 01: o que está a acontecer (cartões em grelha) */}
      <div className="flex items-center justify-between mt-9 mb-4">
        <div className="skeleton h-5 w-56 rounded" />
        <div className="skeleton h-9 w-48 rounded-lg" />
      </div>
      <div className="border-t border-brand-divider grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-4.5 w-3/4 rounded mt-3" />
            <div className="skeleton h-3.5 w-full rounded-full mt-2.5" />
            <div className="skeleton h-3.5 w-2/3 rounded-full mt-1.5" />
            <div className="skeleton h-3 w-28 rounded-full mt-4" />
          </div>
        ))}
      </div>

      {/* Grelha de painéis 2×2 (tarefas, em atraso, decisões, redes) */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-6">
            <div className="skeleton h-4.5 w-40 rounded" />
            {Array.from({ length: 3 }).map((_, j) => (
              <LinhaSkeleton key={j} linhas={2} larguras={['55%', '35%']} />
            ))}
          </div>
        ))}
      </div>

      {/* Calendário de prazos */}
      <div className="mt-6 card p-6">
        <div className="skeleton h-4.5 w-44 rounded" />
        <div className="grid grid-cols-7 gap-2 mt-5">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
