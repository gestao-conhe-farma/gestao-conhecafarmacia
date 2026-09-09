'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * global-error: último recurso — apanha erros que escapam a todos os
 * outros limites, incluindo falhas no layout raiz (ex.: o ecrã preto
 * que já tivemos). Como substitui o documento inteiro, tem de renderizar
 * <html> e <body>. Cores inline porque o CSS global pode não ter carregado.
 */
export default function ErroGlobal({ error, reset }) {
  useEffect(() => {
    console.error('[erro global]', error)
  }, [error])

  return (
    <html lang="pt">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: '#f7f6f2',
          color: '#14231d',
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: '24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#b45309',
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={22} />
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            Algo correu mal na aplicação.
          </h1>
          <p
            style={{
              color: 'rgba(20, 35, 29, 0.6)',
              lineHeight: 1.6,
              margin: '12px 0 0',
            }}
          >
            Ocorreu um erro inesperado. Tenta novamente — se persistir,
            recarrega a página ou partilha o código abaixo com a coordenação.
          </p>

          <div role="alert">
            <code
              style={{
                display: 'block',
                marginTop: 20,
                fontSize: 12,
                fontFamily: 'ui-monospace, monospace',
                background: '#ffffff',
                border: '1px solid #e3e1da',
                borderRadius: 10,
                padding: '10px 12px',
                color: 'rgba(20, 35, 29, 0.7)',
                wordBreak: 'break-all',
              }}
            >
              {error?.digest ?? 'sem digest — ver consola do navegador'}
            </code>
          </div>

          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 22,
              padding: '11px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#00493a',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
