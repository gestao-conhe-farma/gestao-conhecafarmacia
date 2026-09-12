'use client'

import { useEffect } from 'react'

/**
 * Regista o service worker do PWA (assets estáticos apenas — HTML e
 * API ficam sempre na rede, ver public/sw.js). Silencioso: se falhar,
 * a app funciona exatamente como antes.
 */
export default function RegistaSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const registrar = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sem SW: app normal — nada para fazer
      })
    }
    if (document.readyState === 'complete') registrar()
    else window.addEventListener('load', registrar, { once: true })
    return () => window.removeEventListener('load', registrar)
  }, [])

  return null
}
