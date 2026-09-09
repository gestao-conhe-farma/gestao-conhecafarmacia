'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogIn } from 'lucide-react'

export default function FormLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)
  const [aCarregar, setACarregar] = useState(false)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setACarregar(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      // Lê o corpo como texto primeiro: se a resposta não for JSON
      // (ex.: HTML de um redirect/erro), o res.json() lançaria e
      // perderíamos a informação toda.
      const texto = await res.text()
      let data = null
      try {
        data = texto ? JSON.parse(texto) : null
      } catch {
        // corpo não-JSON — logado abaixo
      }

      if (!res.ok) {
        console.group(
          `%c[login] falha ${res.status} ${res.statusText}`,
          'color:#dc2626;font-weight:bold'
        )
        console.log('URL:', res.url)
        console.log('Content-Type:', res.headers.get('content-type'))
        console.log('Corpo:', data ?? texto?.slice(0, 500))
        if (data && typeof data === 'object') {
          const { erro, detalhe, ...resto } = data
          if (detalhe) console.warn('Detalhe do servidor:', detalhe)
          if (Object.keys(resto).length) console.log('Outros campos:', resto)
        }
        console.groupEnd()

        setErro(
          data?.erro ||
            (data
              ? 'Resposta inesperada do servidor. Abre a consola (F12) para detalhes.'
              : `Resposta não-JSON do servidor (HTTP ${res.status}). Abre a consola (F12) para detalhes.`)
        )
        return
      }

      if (!data?.ok) {
        console.warn('[login] resposta 200 sem {ok:true}:', data ?? texto)
        setErro('Resposta inesperada do servidor. Abre a consola (F12) para detalhes.')
        return
      }

      router.replace('/')
      router.refresh()
    } catch (errRede) {
      // Falha real de rede / DNS / abort — quase nunca acontece depois do
      // fix do redirect do proxy, mas fica logado na mesma.
      console.error('[login] exceção no fetch:', errRede)
      setErro(`Erro de rede: ${errRede?.message ?? 'desconhecido'}`)
    } finally {
      setACarregar(false)
    }
  }

  return (
    <form onSubmit={submeter} className="space-y-5">
      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="form-input"
          placeholder="oteu.email@conhecafarmacia.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="password">
          Palavra-passe
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className="form-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {erro}
        </p>
      )}

      <button type="submit" disabled={aCarregar} className="btn btn-primary w-full">
        {aCarregar ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
        {aCarregar ? 'A entrar…' : 'Entrar'}
      </button>
    </form>
  )
}
