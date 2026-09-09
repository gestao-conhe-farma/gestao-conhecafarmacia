export default function Loading() {
  return (
    <div className="container-app max-w-3xl" aria-busy="true" aria-live="polite">
      <div className="skeleton h-9 w-40 rounded-lg mb-2" />
      <div className="skeleton h-4 w-80 max-w-full rounded-full mb-8" />

      <div className="space-y-6">
        {/* Perfil */}
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-6 w-24 rounded-lg" />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="skeleton h-16 w-16 rounded-full" />
            <div>
              <div className="skeleton h-3.5 w-12 rounded-full mb-1.5" />
              <div className="skeleton h-5 w-48 rounded-full" />
            </div>
          </div>
          <div className="skeleton h-4 w-16 rounded-full mb-2" />
          <div className="skeleton h-11 w-full rounded-lg" />
          <div className="skeleton h-9 w-36 mt-4 rounded-lg" />
        </div>

        {/* Palavra-passe */}
        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-6 w-36 rounded-lg" />
          </div>
          <div className="skeleton h-11 w-full rounded-lg mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="skeleton h-11 rounded-lg" />
            <div className="skeleton h-11 rounded-lg" />
          </div>
          <div className="skeleton h-10 w-56 mt-5 rounded-lg" />
        </div>

        {/* Aparência + Sessão */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 md:p-8">
            <div className="skeleton h-10 w-10 rounded-xl mb-4" />
            <div className="skeleton h-14 w-full rounded-xl" />
          </div>
          <div className="card p-6 md:p-8">
            <div className="skeleton h-10 w-10 rounded-xl mb-4" />
            <div className="skeleton h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
