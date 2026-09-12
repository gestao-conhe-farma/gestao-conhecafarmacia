import { CabecalhoSkeleton, LinhaSkeleton } from '../../Skeletons'

/**
 * Loading de /reunioes/[id] — cabeçalho com data/local + botões, e as
 * secções numeradas (pauta/presenças, notas, resumo) que a página real
 * empilha por baixo de cada outra.
 */
export default function Loading() {
  return (
    <div className="container-app max-w-4xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={320} linhas={2} larguras={['70%', '45%']} />

      <div className="skeleton h-10 w-64 rounded-lg mt-2" />

      {/* Secções numeradas */}
      <div className="mt-6 space-y-2">
        {['01', '02', '03'].map((num, i) => (
          <div key={num} className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 py-9 border-t border-brand-divider">
            <span className="skeleton h-3.5 w-6 rounded-full mt-1" />
            <div className="min-w-0">
              <div className="skeleton h-5 rounded" style={{ width: i === 0 ? 200 : 150 }} />
              <div className="mt-4 border-t border-brand-divider">
                <LinhaSkeleton linhas={2} larguras={['55%', '35%']} direita={96} />
              </div>
              {i === 0 && (
                <LinhaSkeleton linhas={2} larguras={['50%', '40%']} direita={96} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
