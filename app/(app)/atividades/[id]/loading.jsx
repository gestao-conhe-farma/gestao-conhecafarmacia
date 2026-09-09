export default function Loading() {
  return (
    <div className="container-app max-w-4xl" aria-busy="true" aria-live="polite">
      <div className="skeleton h-4 w-28 rounded-full mb-6" />

      {/* Cabeçalho da atividade */}
      <div className="card p-6 md:p-8 mb-6">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-8 w-3/4 mt-4 rounded-lg" />
        <div className="skeleton h-4 w-full mt-4 rounded-full" />
        <div className="skeleton h-4 w-5/6 mt-2 rounded-full" />
        <div className="skeleton h-8 w-full mt-6 rounded-lg" />
      </div>

      {/* Painel (entrevista/evento) */}
      <div className="card p-6 md:p-8 mb-6">
        <div className="skeleton h-6 w-48 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-brand-divider/60">
              <div className="skeleton h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="skeleton h-4 w-24 rounded-full" />
                <div className="skeleton h-3 w-32 mt-1.5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtarefas */}
      <div className="card p-6 md:p-8 mb-6">
        <div className="skeleton h-6 w-40 rounded-lg" />
        <div className="mt-4 divide-y divide-brand-divider/60">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-4 flex items-start gap-3">
              <div className="flex-1">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-3.5 w-1/2 mt-2 rounded-full" />
              </div>
              <div className="skeleton h-8 w-8 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
