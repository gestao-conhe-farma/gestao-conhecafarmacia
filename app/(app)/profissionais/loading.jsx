import { CabecalhoSkeleton, LinhaSkeleton } from '../Skeletons'

/**
 * Loading de /profissionais — cabeçalho, barra de pesquisa + filtros e
 * a lista de profissionais (monograma + nome + profissão/instituição).
 */
export default function Loading() {
  return (
    <div className="container-app max-w-4xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={240} linhas={2} larguras={['95%', '75%']} />

      {/* Pesquisa + ver todos */}
      <div className="mt-2 flex items-center gap-2">
        <div className="skeleton h-11 flex-1 max-w-md rounded-lg" />
        <div className="skeleton h-9 w-32 rounded-full" />
      </div>

      <div className="mt-6 border-t border-brand-divider">
        {Array.from({ length: 5 }).map((_, i) => (
          <LinhaSkeleton key={i} avatar={44} linhas={2} larguras={['35%', '50%']} direita={72} />
        ))}
      </div>
    </div>
  )
}
