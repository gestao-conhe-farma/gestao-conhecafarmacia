import { CabecalhoSkeleton, LinhaSkeleton } from '../../Skeletons'

/**
 * Loading do perfil de membro (/equipa/[id]) — avatar grande + nome +
 * pill de papel, linha de contactos, e as secções de histórico.
 */
export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <div className="skeleton h-4 w-28 rounded-full mb-6" />

      {/* Cabeçalho do perfil */}
      <div className="flex items-center gap-5">
        <div className="skeleton h-20 w-20 rounded-full shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="skeleton h-7 w-56 rounded" />
          <div className="skeleton h-3.5 w-32 rounded-full mt-2" />
          <div className="flex gap-2 mt-3">
            <div className="skeleton h-8 w-24 rounded-lg" />
            <div className="skeleton h-8 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Contactos + histórico */}
      <div className="mt-10 space-y-8">
        {[0, 1].map((i) => (
          <div key={i} className="border-t border-brand-divider pt-6">
            <div className="skeleton h-5 rounded" style={{ width: i === 0 ? 150 : 210 }} />
            <div className="mt-2">
              <LinhaSkeleton linhas={2} larguras={['45%', '30%']} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
