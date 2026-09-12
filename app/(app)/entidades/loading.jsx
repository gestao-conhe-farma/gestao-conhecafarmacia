import { CabecalhoSkeleton, LinhaSkeleton } from '../Skeletons'

/**
 * Loading de /entidades — cabeçalho, linha de filtro/tabs e a lista de
 * entidades (monograma + nome + tipo/notas + ações).
 */
export default function Loading() {
  return (
    <div className="container-app max-w-4xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={200} linhas={2} larguras={['90%', '70%']} />

      {/* Filtros de tipo + ver todos */}
      <div className="mt-2 flex items-center gap-2">
        <div className="skeleton h-9 w-40 rounded-lg" />
        <div className="skeleton h-9 w-32 rounded-full" />
        <div className="skeleton h-9 w-36 rounded-full" />
      </div>

      <div className="mt-6 border-t border-brand-divider">
        {Array.from({ length: 5 }).map((_, i) => (
          <LinhaSkeleton key={i} avatar={44} linhas={2} larguras={['40%', '55%']} direita={72} />
        ))}
      </div>
    </div>
  )
}
