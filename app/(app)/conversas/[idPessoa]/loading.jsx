import { CabecalhoSkeleton } from '../../Skeletons'

/**
 * Loading da thread de conversa — cabeçalho com o colega + cartão com
 * as bolhas de chat (alternadas esquerda/direita) e a barra de escrever.
 */
export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      {/* Voltar + cabeçalho do colega */}
      <div className="skeleton h-4 w-36 rounded-full mb-6" />
      <div className="flex items-center gap-4 mb-7">
        <div className="skeleton h-12 w-12 rounded-full shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-3 w-40 rounded-full mt-2" />
        </div>
      </div>

      {/* Cartão da conversa */}
      <div className="card p-4 md:p-5">
        <div className="flex flex-col space-y-2 py-2">
          {/* separador de dia */}
          <div className="flex items-center gap-3 py-2">
            <div className="skeleton h-px flex-1" />
            <div className="skeleton h-3 w-32 rounded-full" />
            <div className="skeleton h-px flex-1" />
          </div>
          {/* recebidas (esquerda) */}
          {[80, 60].map((w, i) => (
            <div key={`r${i}`} className="flex flex-col items-start py-1">
              <div className="skeleton h-3 w-16 rounded-full mb-1" />
              <div className="skeleton rounded-2xl rounded-bl-md" style={{ width: `${w}%`, height: 38 }} />
            </div>
          ))}
          {/* enviadas (direita) */}
          {[70, 45].map((w, i) => (
            <div key={`e${i}`} className="flex flex-col items-end py-1">
              <div className="skeleton rounded-2xl rounded-br-md" style={{ width: `${w}%`, height: 38 }} />
            </div>
          ))}
        </div>
        {/* barra de escrever */}
        <div className="flex items-end gap-2 pt-3 mt-1 border-t border-brand-divider">
          <div className="skeleton h-[42px] flex-1 rounded-lg" />
          <div className="skeleton h-[42px] w-16 rounded-lg shrink-0" />
        </div>
      </div>
    </div>
  )
}
