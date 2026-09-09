export default function Loading() {
  return (
    <div className="container-app max-w-4xl" aria-busy="true" aria-live="polite">
      <div className="skeleton h-9 w-32 rounded-lg mb-2" />
      <div className="skeleton h-4 w-96 max-w-full mt-2 rounded-full mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Lista de membros */}
        <div className="lg:col-span-3 card p-6 md:p-8">
          <div className="skeleton h-6 w-36 rounded-lg mb-4" />
          <div className="divide-y divide-brand-divider/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="py-4 flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-full shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="skeleton h-4 w-32 rounded-full" />
                  <div className="skeleton h-3.5 w-44 mt-1.5 rounded-full" />
                </div>
                <div className="skeleton h-8 w-24 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Formulário */}
        <div className="lg:col-span-2 card p-6 md:p-8">
          <div className="skeleton h-6 w-28 rounded-lg mb-5" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-4">
              <div className="skeleton h-4 w-20 rounded-full mb-2" />
              <div className="skeleton h-11 w-full rounded-lg" />
            </div>
          ))}
          <div className="skeleton h-11 w-full rounded-lg mt-6" />
        </div>
      </div>
    </div>
  )
}
