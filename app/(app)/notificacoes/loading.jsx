import { CabecalhoSkeleton, LinhaSkeleton } from '../Skeletons'

/**
 * Loading de /notificacoes — cabeçalho estreito + lista dividida com
 * ponto de cor, título, corpo e hora (o padrão exato da ListaNotificacoes).
 */
export default function Loading() {
  return (
    <div className="container-app max-w-2xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={240} linhas={1} larguras={['55%']} />

      <div className="mt-6 divide-y divide-brand-divider border border-brand-divider rounded-xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-4 py-3.5">
            <div className="skeleton h-2 w-2 rounded-full mt-2 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 rounded" style={{ width: `${70 - i * 8}%` }} />
              <div className="skeleton h-3.5 w-3/4 rounded-full mt-1.5" />
              <div className="skeleton h-3 w-16 rounded-full mt-1.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
