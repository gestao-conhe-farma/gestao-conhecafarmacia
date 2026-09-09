'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
import { criarPrimeiroSuperAdmin } from './actions'

export default function FormSetup({ emailSugerido }) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState(emailSugerido || '')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)
  const [aCarregar, setACarregar] = useState(false)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setACarregar(true)
    try {
      const resultado = await criarPrimeiroSuperAdmin({ nome, email, password })
      if (!resultado.ok) {
        setErro(resultado.erro || 'Não foi possível criar a conta.')
        return
      }
      router.replace('/')
      router.refresh()
    } finally {
      setACarregar(false)
    }
  }

  return (
    <form onSubmit={submeter} className="mt-6 space-y-4">
      <div className="form-group">
        <label className="form-label" htmlFor="nome">Nome completo</label>
        <input
          id="nome"
          className="form-input"
          required
          placeholder="Ex.: Maria Domingos"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="form-input"
          required
          placeholder="geral@conhecafarmacia.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="password">Palavra-passe</label>
        <input
          id="password"
          type="password"
          className="form-input"
          required
          minLength={8}
          placeholder="Mínimo de 8 caracteres"
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
        {aCarregar ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
        {aCarregar ? 'A criar conta…' : 'Criar conta de coordenação'}
      </button>
    </form>
  )
}
