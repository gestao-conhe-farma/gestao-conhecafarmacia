/**
 * Service worker do PWA Gestão CF.
 *
 * Estratégia deliberadamente conservadora — é uma app interna, em que tudo
 * o que importa é dado vivo (e a sessão expira): NADA de HTML, API ou
 * Supabase passa por aqui. O cache cobre só assets imutáveis (/_next/static,
 * ícones, logo) — installável + carregamentos mais rápidos, sem risco de
 * mostrar dados velhos ou partir o login.
 */
const VERSAO = 'cf-gestao-v1'
const CACHE = `cf-static-${VERSAO}`
const ESTATICOS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/logo/logo-principal-branco.svg',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ESTATICOS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request

  // Só GET, só mesma origem — o Supabase (outra origem) nunca é tocado
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navegações (HTML) e API: sempre rede — dado vivo, sessão fresca
  if (req.mode === 'navigate' || url.pathname.startsWith('/api/')) return

  // Cache-first para assets imutáveis do build
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            if (res.ok) {
              const copia = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copia))
            }
            return res
          })
      )
    )
    return
  }

  // Restantes assets públicos (ícones, logo…): stale-while-revalidate
  e.respondWith(
    caches.match(req).then((hit) => {
      const rede = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return res
        })
        .catch(() => hit)
      return hit ?? rede
    })
  )
})
