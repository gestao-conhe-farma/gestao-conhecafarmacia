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
        // Sem debug na consola: o corpo podia incluir o email tentado e
        // detalhes internos — fica só a mensagem amigável na UI.
        setErro(
          data?.erro ||
            (data
              ? 'Resposta inesperada do servidor. Tenta novamente.'
              : `Erro do servidor (HTTP ${res.status}). Tenta novamente.`)
        )
        return
      }

      if (!data?.ok) {
        setErro('Resposta inesperada do servidor. Tenta novamente.')
        return
      }

      router.replace('/')
      router.refresh()
    } catch (errRede) {
      // Falha real de rede / DNS / abort — quase nunca acontece.
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
