import { CabecalhoSkeleton, LinhaSkeleton } from '../../../../Skeletons'

/**
 * Loading do detalhe de subtarefa — cabeçalho com estado + ações e as
 * secções numeradas (relatório, aprovação) do ecrã real.
 */
export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <div className="skeleton h-4 w-40 rounded-full mb-6" />

      <CabecalhoSkeleton kicker titulo={300} linhas={1} larguras={['50%']} />
      <div className="skeleton h-9 w-56 rounded-lg mt-3" />

      <div className="mt-6 space-y-2">
        {['01', '02'].map((num) => (
          <div key={num} className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 py-9 border-t border-brand-divider">
            <span className="skeleton h-3.5 w-6 rounded-full mt-1" />
            <div className="min-w-0">
              <div className="skeleton h-5 w-44 rounded" />
              <div className="mt-4">
                <LinhaSkeleton linhas={2} larguras={['60%', '40%']} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
