import { CabecalhoSkeleton, LinhaSkeleton } from '../Skeletons'

/**
 * Loading de /anuncios — cabeçalho, cartões de anúncio numerados.
 * (A coordenação vê também o formulário; o skeleton mantém-se simples.)
 */
export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={200} linhas={2} larguras={['85%', '60%']} />

      <div className="mt-6 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="skeleton h-3 w-36 rounded-full" />
                <div className="skeleton h-5 w-2/3 rounded mt-2" />
              </div>
              <div className="skeleton h-8 w-8 rounded-lg shrink-0" />
            </div>
            <div className="skeleton h-3.5 w-full rounded-full mt-4" />
            <div className="skeleton h-3.5 w-5/6 rounded-full mt-1.5" />
            <div className="skeleton h-3 w-40 rounded-full mt-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
