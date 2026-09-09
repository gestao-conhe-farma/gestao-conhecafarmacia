export default function Loading() {
  return (
    <div className="container-app" aria-busy="true" aria-live="polite">
      <div className="page-head">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-10 w-56 mt-3 rounded-lg" />
        <div className="skeleton h-4 w-96 max-w-full mt-3 rounded-full" />
      </div>

      {/* Pesquisa + tabs */}
      <div className="skeleton h-11 w-full max-w-md rounded-lg" />
      <div className="flex gap-4 border-b border-brand-divider mt-6 pb-3">
        <div className="skeleton h-4 w-14 rounded-full" />
        <div className="skeleton h-4 w-28 rounded-full" />
        <div className="skeleton h-4 w-24 rounded-full" />
        <div className="skeleton h-4 w-20 rounded-full" />
      </div>

      {/* Linhas de documentos com monograma */}
      <div className="flex items-baseline justify-between mt-7 mb-3">
        <div className="skeleton h-5 w-44 rounded" />
        <div className="skeleton h-4 w-16 rounded-full" />
      </div>
      <div className="border-t border-brand-divider">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-4 border-b border-brand-divider flex items-center gap-4">
            <div className="skeleton h-11 w-11 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="skeleton h-3 w-1/2 mt-1.5 rounded-full" />
            </div>
            <div className="skeleton h-8 w-8 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
