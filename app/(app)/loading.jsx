export default function Loading() {
  return (
    <div className="container-app" aria-busy="true" aria-live="polite">
      {/* Cabeçalho editorial */}
      <div className="page-head">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton h-10 w-72 mt-3 rounded-lg" />
        <div className="skeleton h-4 w-52 mt-3 rounded-full" />
      </div>

      {/* Banda KPI com réguas verticais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`px-5 first:pl-0 ${i > 0 ? 'lg:border-l lg:border-brand-divider' : ''} py-1`}
          >
            <div className="skeleton h-8 w-14 rounded" />
            <div className="skeleton h-3 w-20 mt-2 rounded-full" />
          </div>
        ))}
      </div>

      {/* Tabs sublinhadas + linhas editoriais */}
      <div className="flex gap-4 border-b border-brand-divider pb-3 mb-2">
        <div className="skeleton h-4 w-16 rounded-full" />
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-4 w-24 rounded-full" />
      </div>
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-5 border-b border-brand-divider flex items-center gap-5">
            <div className="skeleton h-10 w-12 rounded shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="skeleton h-4 w-3/5 rounded" />
              <div className="skeleton h-3 w-2/5 mt-2 rounded-full" />
            </div>
            <div className="skeleton h-4 w-4 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
