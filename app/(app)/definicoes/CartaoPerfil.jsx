'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { atualizarNome } from './actions'

export default function CartaoPerfil({ pessoa }) {
  const router = useRouter()
  const [nome, setNome] = useState(pessoa.nome)
  const [aGuardar, setAGuardar] = useState(false)
  const [msg, setMsg] = useState(null)
  const [erro, setErro] = useState(null)

  const alterado = nome !== pessoa.nome

  async function guardar(e) {
    e.preventDefault()
    setErro(null)
    setMsg(null)
    setAGuardar(true)
    try {
      const r = await atualizarNome(nome)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setMsg('Nome atualizado.')
      router.refresh()
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-brand-primary text-white grid place-items-center font-bold text-xl shrink-0">
          {pessoa.nome.split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('')}
        </span>
        <div className="min-w-0">
          <p className="font-bold text-brand-deep text-[15px] flex flex-wrap items-center gap-2">
            {pessoa.nome}
            <span className={`role-pill ${pessoa.role === 'super_admin' ? 'role-super' : 'role-membro'}`}>
              {pessoa.role === 'super_admin' ? 'Coordenação' : 'Membro'}
            </span>
          </p>
          <p className="text-[13px] text-brand-deep/50 truncate">{pessoa.email}</p>
        </div>
      </div>

      <form onSubmit={guardar} className="space-y-4 mt-6 max-w-md">
        <div className="form-group">
          <label className="form-label" htmlFor="d-nome">Nome</label>
          <input
            id="d-nome"
            className="form-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="O teu nome"
          />
          <p className="text-xs text-brand-deep/45 mt-1">
            O email não pode ser alterado aqui — se for necessário, a coordenação
            trata no painel Supabase.
          </p>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{erro}</p>
        )}
        {msg && (
          <p className="text-sm text-brand-accent bg-brand-accent/10 border border-brand-accent/20 rounded-lg px-4 py-3">{msg}</p>
        )}

        <button type="submit" disabled={!alterado || aGuardar} className="btn btn-primary btn-small">
          {aGuardar ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
          {aGuardar ? 'A guardar…' : 'Guardar nome'}
        </button>
      </form>
    </div>
  )
}
