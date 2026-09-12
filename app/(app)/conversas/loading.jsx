import { CabecalhoSkeleton } from '../Skeletons'

/**
 * Loading de /conversas — cabeçalho, lista "Em curso" (avatar + nome +
 * prévia) e a grelha "Nova conversa" com cartões de membro.
 */
export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={200} linhas={2} larguras={['85%', '60%']} />

      {/* Em curso */}
      <section className="mt-6">
        <div className="skeleton h-5 w-24 rounded mb-3" />
        <div className="border-t border-brand-divider">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3.5 border-b border-brand-divider flex items-center gap-4">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-3 w-3/5 rounded-full mt-1.5" />
              </div>
              <div className="skeleton h-3 w-12 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Nova conversa */}
      <section className="mt-10">
        <div className="skeleton h-5 w-32 rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel px-4 py-3 flex items-center gap-3.5">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/3 rounded-full mt-1.5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
