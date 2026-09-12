import { CabecalhoSkeleton, LinhaSkeleton } from '../Skeletons'

/**
 * Loading de /aprovacoes — cabeçalho estreito + lista de subtarefas
 * pendentes (ponto de estado + título + meta + botões à direita).
 */
export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={220} linhas={2} larguras={['80%', '55%']} />

      <div className="mt-2 border-t border-brand-divider">
        {Array.from({ length: 3 }).map((_, i) => (
          <LinhaSkeleton key={i} linhas={2} larguras={['55%', '35%']} direita={120} />
        ))}
      </div>
    </div>
  )
}
