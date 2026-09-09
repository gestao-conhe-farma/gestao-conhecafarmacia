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
      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || 'Não foi possível entrar. Verifica os dados.')
        return
      }
      router.replace('/')
      router.refresh()
    } catch {
      setErro('Erro de rede. Tenta novamente.')
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
