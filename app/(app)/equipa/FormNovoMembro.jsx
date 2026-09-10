'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
import { criarConta } from './actions'

export default function FormNovoMembro() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [aCarregar, setACarregar] = useState(false)
  const [msg, setMsg] = useState(null)
  const [erro, setErro] = useState(null)

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setMsg(null)
    setACarregar(true)
    try {
      const r = await criarConta({ nome, email, password, role })
      if (!r.ok) {
        setErro(r.erro || 'Não foi possível criar a conta.')
        return
      }
      setMsg(
        r.reativada
          ? `Conta reativada para ${email} — mesma identidade e histórico. Partilha as novas credenciais.`
          : `Conta criada para ${email}. Partilha as credenciais com a pessoa.`
      )
      setNome('')
      setEmail('')
      setPassword('')
      setRole('admin')
      router.refresh()
    } finally {
      setACarregar(false)
    }
  }

  return (
    <form onSubmit={submeter} className="space-y-4">
      <div className="form-group">
        <label className="form-label" htmlFor="n-nome">Nome completo</label>
        <input
          id="n-nome"
          className="form-input"
          required
          placeholder="Ex.: João Silva"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="n-email">Email</label>
        <input
          id="n-email"
          type="email"
          className="form-input"
          required
          placeholder="joao@conhecafarmacia.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="n-pass">Palavra-passe inicial</label>
        <input
          id="n-pass"
          type="text"
          className="form-input"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="n-role">Papel</label>
        <select
          id="n-role"
          className="form-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="admin">Membro (admin)</option>
          <option value="super_admin">Coordenação (super_admin)</option>
        </select>
        <p className="text-xs text-brand-deep/45 mt-1">
          Membros criam subtarefas e confirmam entrevistas. A coordenação cria
          atividades de topo e aprova.
        </p>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {erro}
        </p>
      )}
      {msg && (
        <p className="text-sm text-brand-accent bg-brand-accent/10 border border-brand-accent/20 rounded-lg px-4 py-3">
          {msg}
        </p>
      )}

      <button type="submit" disabled={aCarregar} className="btn btn-primary w-full">
        {aCarregar ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
        {aCarregar ? 'A criar…' : 'Criar conta'}
      </button>
    </form>
  )
}
