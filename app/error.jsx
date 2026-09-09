'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Error boundary do segmento raiz: apanha erros de render fora do grupo
 * (app) — por exemplo nas páginas /login e /setup.
 */
export default function ErroRaiz({ error, reset }) {
  useEffect(() => {
    console.error('[erro]', error)
  }, [error])

  return (
    <div className="min-h-dvh grid place-items-center bg-brand-bg px-6 py-12">
      <div className="w-full max-w-md text-center">
        <span className="inline-grid place-items-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 mb-5">
          <AlertTriangle size={22} />
        </span>
        <h1 className="text-2xl font-extrabold text-brand-deep tracking-tight">
          Algo correu mal.
        </h1>
        <p className="text-brand-deep/60 mt-2.5 leading-relaxed">
          Ocorreu um erro inesperado. Tenta novamente — se persistir, partilha
          o código abaixo com a coordenação.
        </p>

        <div role="alert" className="mt-6">
          <code className="block text-xs font-mono bg-brand-card border border-brand-divider rounded-lg px-3 py-2.5 text-brand-deep/70 break-all">
            {error?.digest ?? 'sem digest — ver consola do navegador'}
          </code>
        </div>

        <button onClick={reset} className="btn btn-primary mt-6">
          <RotateCcw size={16} />
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
