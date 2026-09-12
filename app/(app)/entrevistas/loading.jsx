import { CabecalhoSkeleton } from '../Skeletons'

/**
 * Loading de /entrevistas — cabeçalho estreito + cartões de convite
 * (avatar do convite, título, meta, botão de resposta à direita).
 */
export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={290} linhas={2} larguras={['85%', '60%']} />

      <div className="mt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 mb-4">
            <div className="flex items-start gap-4">
              <div className="skeleton h-11 w-11 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="skeleton h-4.5 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded-full mt-2" />
                <div className="skeleton h-3 w-2/5 rounded-full mt-1.5" />
              </div>
              <div className="skeleton h-9 w-28 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
