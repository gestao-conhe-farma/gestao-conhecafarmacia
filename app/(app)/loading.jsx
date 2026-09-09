export default function Loading() {
  return (
    <div className="container-app" aria-busy="true" aria-live="polite">
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton h-9 w-72 mt-3 rounded-lg" />
        <div className="skeleton h-4 w-52 mt-2 rounded-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className="skeleton h-11 w-11 rounded-[14px] shrink-0" />
            <div className="flex-1">
              <div className="skeleton h-6 w-12 rounded" />
              <div className="skeleton h-3 w-20 mt-2 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Filtros + grid */}
      <div className="skeleton h-8 w-64 rounded-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-6">
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-5 w-4/5 mt-4 rounded" />
            <div className="skeleton h-4 w-full mt-3 rounded-full" />
            <div className="skeleton h-4 w-2/3 mt-2 rounded-full" />
            <div className="skeleton h-8 w-full mt-5 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
