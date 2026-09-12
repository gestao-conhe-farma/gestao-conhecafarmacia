import { CabecalhoSkeleton } from '../Skeletons'

/**
 * Loading de /atividades — cabeçalho com botão à direita, abas de tipo
 * e a grelha de cartões de atividade (3 colunas no desktop).
 */
export default function Loading() {
  return (
    <div className="container-app" aria-busy="true" aria-live="polite">
      <div className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-4 w-full">
          <div className="flex-1">
            <div className="skeleton h-3 w-24 rounded-full" />
            <div className="skeleton h-10 w-52 rounded-lg mt-3" />
            <div className="skeleton h-4 w-96 max-w-full rounded-full mt-3" />
          </div>
          <div className="skeleton h-10 w-36 rounded-lg shrink-0" />
        </div>
      </div>

      {/* Abas de tipo */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-9 rounded-full" style={{ width: [90, 80, 96, 110][i] }} />
        ))}
      </div>

      {/* Grelha de cartões de atividade */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-3.5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-4.5 w-5/6 rounded mt-3.5" />
            <div className="skeleton h-3.5 w-full rounded-full mt-2.5" />
            <div className="skeleton h-3.5 w-3/4 rounded-full mt-1.5" />
            <div className="flex items-center gap-2 mt-5 pt-3 border-t border-brand-divider">
              <div className="skeleton h-6 w-6 rounded-full" />
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton h-3 w-16 rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
