import { CabecalhoSkeleton } from '../Skeletons'

/**
 * Loading de /guia — cabeçalho + o padrão de secções numeradas do
 * artigo (régua fina, título, blocos de texto).
 */
export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={300} linhas={2} larguras={['80%', '55%']} />

      <div className="mt-8 max-w-2xl space-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <section key={i} className="border-t border-brand-divider pt-6">
            <div className="skeleton h-5 w-56 rounded" />
            <div className="space-y-2.5 mt-3">
              <div className="skeleton h-3.5 w-full rounded-full" />
              <div className="skeleton h-3.5 w-11/12 rounded-full" />
              <div className="skeleton h-3.5 w-3/4 rounded-full" />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
