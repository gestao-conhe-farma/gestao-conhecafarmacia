export default function Loading() {
  return (
    <div className="container-app max-w-4xl" aria-busy="true" aria-live="polite">
      <div className="skeleton h-4 w-28 rounded-full mb-7" />

      {/* Cabeçalho editorial */}
      <div className="page-head">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-9 w-3/4 mt-4 rounded-lg" />
        <div className="skeleton h-4 w-full max-w-2xl mt-4 rounded-full" />
        <div className="skeleton h-4 w-5/6 max-w-2xl mt-2 rounded-full" />
        <div className="flex gap-10 mt-7">
          <div>
            <div className="skeleton h-2.5 w-12 rounded-full mb-2" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
          <div>
            <div className="skeleton h-2.5 w-20 rounded-full mb-2" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div>
            <div className="skeleton h-2.5 w-16 rounded-full mb-2" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
        </div>
      </div>

      {/* Secção subtarefas */}
      <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
        <div className="skeleton h-3.5 w-6 rounded-full mt-1" />
        <div>
          <div className="flex items-baseline justify-between">
            <div className="skeleton h-5 w-32 rounded" />
            <div className="skeleton h-4 w-20 rounded-full" />
          </div>
          <div className="mt-4 border-t border-brand-divider">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-4 border-b border-brand-divider flex items-start gap-3">
                <div className="skeleton h-2 w-2 rounded-full mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/2 mt-2 rounded-full" />
                </div>
                <div className="skeleton h-7 w-7 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secção nova subtarefa */}
      <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
        <div className="skeleton h-3.5 w-6 rounded-full mt-1" />
        <div>
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-3.5 w-2/3 mt-2 rounded-full" />
          <div className="skeleton h-10 w-44 mt-5 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
