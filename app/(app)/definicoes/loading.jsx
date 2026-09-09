export default function Loading() {
  const secoes = ['01', '02', '03', '04']

  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <div className="page-head">
        <div className="skeleton h-3 w-16 rounded-full" />
        <div className="skeleton h-10 w-44 mt-3 rounded-lg" />
        <div className="skeleton h-4 w-80 max-w-full mt-3 rounded-full" />
      </div>

      {secoes.map((num, i) => (
        <div
          key={num}
          className={`grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider ${
            i === 0 ? '!border-t-2 !border-ink-strong' : ''
          }`}
        >
          <div className="skeleton h-3.5 w-6 rounded-full mt-1" />
          <div>
            <div className="skeleton h-5 w-36 rounded" />
            <div className="skeleton h-3.5 w-2/3 mt-2 rounded-full" />

            {i === 0 && (
              <div className="mt-6 flex items-center gap-4">
                <div className="skeleton h-16 w-16 rounded-full shrink-0" />
                <div className="flex-1 max-w-xs">
                  <div className="skeleton h-11 w-full rounded-lg" />
                </div>
              </div>
            )}
            {i === 1 && (
              <div className="mt-6 space-y-4 max-w-md">
                <div className="skeleton h-11 w-full rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="skeleton h-11 rounded-lg" />
                  <div className="skeleton h-11 rounded-lg" />
                </div>
                <div className="skeleton h-10 w-52 rounded-lg" />
              </div>
            )}
            {i === 2 && <div className="skeleton h-14 w-full max-w-md mt-6 rounded-xl" />}
            {i === 3 && (
              <div className="mt-6 flex gap-3">
                <div className="skeleton h-10 w-44 rounded-lg" />
                <div className="skeleton h-10 w-56 rounded-lg" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
