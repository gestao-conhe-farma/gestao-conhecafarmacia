'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'

/**
 * Error boundary do grupo (app): apanha erros de render das páginas
 * autenticadas e mostra mensagem amigável com opção de repetir.
 * O detalhe técnico segue na consola (browser) e nos logs do servidor
 * (o digest liga os dois — partilhar o digest facilita o diagnóstico).
 */
export default function ErroApp({ error, reset }) {
  useEffect(() => {
    console.error('[erro na app]', error)
  }, [error])

  return (
    <div className="container-app max-w-xl py-14">
      <div className="page-head">
        <p className="kicker">Erro inesperado</p>
        <h1 className="text-3xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Algo correu mal nesta página.
        </h1>
        <p className="text-brand-deep/60 mt-3 leading-relaxed">
          O problema foi registado. Tenta novamente — se persistir, informa a
          coordenação e partilha o código abaixo para conseguirmos localizar
          o erro nos registos.
        </p>
      </div>

      <div role="alert" className="card p-6 md:p-8">
        <div className="flex items-start gap-4">
          <span className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 grid place-items-center shrink-0">
            <AlertTriangle size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-deep">
              Código do erro (digest)
            </p>
            <code className="block mt-1.5 text-xs font-mono bg-brand-bg-alt border border-brand-divider rounded-lg px-3 py-2 text-brand-deep/70 break-all">
              {error?.digest ?? 'sem digest — ver consola do navegador'}
            </code>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={reset} className="btn btn-primary">
            <RotateCcw size={16} />
            Tentar novamente
          </button>
          <Link href="/" className="btn btn-secondary">
            <Home size={16} />
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
