export default function Loading() {
  return (
    <div className="container-app max-w-[1160px]" aria-busy="true" aria-live="polite">
      <div className="page-head">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-10 w-36 mt-3 rounded-lg" />
        <div className="skeleton h-4 w-96 max-w-full mt-3 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">
        {/* Tabela de membros */}
        <div>
          <div className="skeleton h-3.5 w-48 rounded-full pb-3 border-b-2 border-brand-divider" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-4 border-b border-brand-divider flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="skeleton h-4 w-32 rounded-full" />
                <div className="skeleton h-3.5 w-44 mt-1.5 rounded-full" />
              </div>
              <div className="skeleton h-8 w-24 rounded-lg shrink-0" />
            </div>
          ))}
        </div>

        {/* Painel criar conta */}
        <div className="panel p-6 md:p-7">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-3.5 w-full mt-2 rounded-full" />
          <div className="skeleton h-3.5 w-3/4 mt-1.5 rounded-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mt-5">
              <div className="skeleton h-3.5 w-20 rounded-full mb-2" />
              <div className="skeleton h-11 w-full rounded-lg" />
            </div>
          ))}
          <div className="skeleton h-11 w-full rounded-lg mt-6" />
        </div>
      </div>
    </div>
  )
}
