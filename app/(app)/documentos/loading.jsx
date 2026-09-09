export default function Loading() {
  return (
    <div className="container-app" aria-busy="true" aria-live="polite">
      <div className="skeleton h-3 w-24 rounded-full" />
      <div className="skeleton h-9 w-56 mt-3 rounded-lg" />
      <div className="skeleton h-4 w-96 max-w-full mt-2 rounded-full" />

      {/* Filtros */}
      <div className="card p-5 mt-8">
        <div className="skeleton h-11 w-full rounded-lg" />
        <div className="flex flex-wrap gap-2 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Linhas de documentos */}
      <div className="card mt-6 divide-y divide-brand-divider/60 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 flex items-center gap-4">
            <div className="skeleton h-11 w-11 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-5 w-2/3 rounded" />
              <div className="skeleton h-3.5 w-1/2 mt-1.5 rounded-full" />
            </div>
            <div className="skeleton h-9 w-28 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
