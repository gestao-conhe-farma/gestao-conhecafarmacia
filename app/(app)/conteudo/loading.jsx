import { CabecalhoSkeleton } from '../Skeletons'

/**
 * Loading de /conteudo — cabeçalho + a grelha de calendário editorial
 * (cabeçalhos de plataforma + células de dia).
 */
export default function Loading() {
  return (
    <div className="container-app max-w-5xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={300} linhas={2} larguras={['90%', '65%']} />

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-9 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-8 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
