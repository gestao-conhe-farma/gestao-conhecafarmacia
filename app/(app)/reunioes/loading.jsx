import { CabecalhoSkeleton } from '../Skeletons'

/**
 * Loading de /reunioes — cabeçalho com botões, secção "Próximas" e
 * "Histórico" com as linhas de reunião (caixa de data + título + meta).
 */
function LinhaReuniao() {
  return (
    <div className="py-4 border-b border-brand-divider flex items-center gap-4">
      <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="skeleton h-4 w-2/5 rounded" />
        <div className="skeleton h-3 w-1/3 rounded-full mt-1.5" />
      </div>
      <div className="skeleton h-7 w-24 rounded-full shrink-0" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="container-app" aria-busy="true" aria-live="polite">
      <div className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-4 w-full">
          <div className="flex-1">
            <div className="skeleton h-3 w-16 rounded-full" />
            <div className="skeleton h-10 w-44 rounded-lg mt-3" />
            <div className="skeleton h-4 w-[420px] max-w-full rounded-full mt-3" />
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="skeleton h-9 w-32 rounded-lg" />
            <div className="skeleton h-10 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Próximas */}
      <section className="mt-9">
        <div className="skeleton h-5 w-28 rounded mb-3" />
        <div className="border-t border-brand-divider">
          {Array.from({ length: 3 }).map((_, i) => (
            <LinhaReuniao key={i} />
          ))}
        </div>
      </section>

      {/* Histórico */}
      <section className="mt-10">
        <div className="skeleton h-5 w-24 rounded mb-3" />
        <div className="border-t border-brand-divider">
          {Array.from({ length: 2 }).map((_, i) => (
            <LinhaReuniao key={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
