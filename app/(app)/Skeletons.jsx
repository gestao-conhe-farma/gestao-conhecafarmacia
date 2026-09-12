/**
 * Primitivas de skeleton partilhadas — cada loading.jsx de rota compõe
 * estas para espelhar o LAYOUT REAL da página (nada de esqueleto
 * genérico): mesmo contentor, mesmas secções, mesmas linhas. Quando a
 * página aparece, nada salta.
 *
 * A classe `skeleton` (globals.css) traz o shimmer; cada rota traz o
 * seu wrapper com aria-busy + aria-live para leitores de ecrã.
 */

/** Cabeçalho editorial: kicker + título + linhas de descrição. */
export function CabecalhoSkeleton({ kicker = 88, titulo = 260, linhas = 2, larguras = [] }) {
  return (
    <div className="page-head">
      <div className="skeleton h-3 w-24 rounded-full" />
      <div className="skeleton h-10 rounded-lg mt-3" style={{ width: titulo }} />
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded-full mt-3"
          style={{ width: larguras[i] ?? (i === linhas - 1 ? '65%' : '90%') }}
        />
      ))}
    </div>
  )
}

/** Secção numerada (linguagem editorial da app): número + título + linha. */
export function SecaoSkeleton({ num = '01', titulo = 180 }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="skeleton h-3 w-6 rounded-full" />
      <span className="skeleton h-5 rounded" style={{ width: titulo }} />
      <span className="skeleton h-4 w-16 rounded-full ml-auto" />
    </div>
  )
}

/** Linha de lista editorial (o padrão py-4 border-b usado em toda a app). */
export function LinhaSkeleton({ avatar = null, linhas = 2, larguras = ['60%', '40%'], direita = null }) {
  return (
    <div className="py-4 border-b border-brand-divider flex items-center gap-4">
      {avatar && <div className="skeleton rounded-full shrink-0" style={{ width: avatar, height: avatar }} />}
      <div className="min-w-0 flex-1">
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} className="skeleton h-4 rounded mt-1.5 first:mt-0" style={{ width: larguras[i] ?? '60%' }} />
        ))}
      </div>
      {direita && <div className="skeleton h-8 shrink-0 rounded-lg" style={{ width: direita }} />}
      </div>
  )
}

/** Cartão genérico (para grids de cartões). */
export function CartaoSkeleton({ altura = 150 }) {
  return (
    <div className="card p-5">
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-3.5 w-full rounded-full mt-2.5" />
      <div className="skeleton h-3.5 w-5/6 rounded-full mt-1.5" />
      <div className="skeleton h-3 w-24 rounded-full mt-4" />
      <div className="skeleton rounded-lg mt-4" style={{ height: altura / 6 }} />
    </div>
  )
}

/** Banda destaque (anúncio / reunião da homepage). */
export function BandaSkeleton() {
  return (
    <div className="mt-6 border-y border-brand-divider bg-brand-primary/[0.04] flex items-center gap-4 py-4 px-1">
      <div className="skeleton h-10 w-10 rounded-full shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="skeleton h-3 w-40 rounded-full" />
        <div className="skeleton h-4 w-64 max-w-full rounded mt-2" />
      </div>
      <div className="skeleton h-6 w-14 rounded-full shrink-0" />
    </div>
  )
}
