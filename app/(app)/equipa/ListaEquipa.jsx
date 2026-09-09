'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { alterarRole, removerMembro } from './actions'

export default function ListaEquipa({ equipa, pessoaAtualId }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)
  const [erro, setErro] = useState(null)

  async function mudarRole(id, role) {
    setAProcessar(id)
    setErro(null)
    try {
      const r = await alterarRole(id, role)
      if (!r.ok) setErro(r.erro)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  async function remover(id, nome) {
    if (!confirm(`Remover o acesso de ${nome}? Esta ação apaga a conta e não pode ser revertida.`)) {
      return
    }
    setAProcessar(id)
    setErro(null)
    try {
      const r = await removerMembro(id)
      if (!r.ok) setErro(r.erro)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  return (
    <div>
      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
          {erro}
        </p>
      )}
      <ul className="divide-y divide-brand-divider/60">
        {equipa.map((p) => (
          <li key={p.id} className="py-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary grid place-items-center font-bold text-sm shrink-0">
              {p.nome.split(/\s+/).slice(0, 2).map((x) => x[0].toUpperCase()).join('')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-brand-deep truncate">
                {p.nome}
                {p.id === pessoaAtualId && (
                  <span className="ml-2 text-xs font-normal text-brand-deep/45">(tu)</span>
                )}
              </p>
              <p className="text-sm text-brand-deep/50 truncate">{p.email}</p>
            </div>

            {aProcessar === p.id ? (
              <Loader2 size={18} className="animate-spin text-brand-accent shrink-0" />
            ) : p.id === pessoaAtualId ? (
              <span className={`badge ${p.role === 'super_admin' ? 'badge-status-concluida' : 'badge-tipo-atividade'}`}>
                {p.role === 'super_admin' ? 'Coordenação' : 'Membro'}
              </span>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={p.role}
                  onChange={(e) => mudarRole(p.id, e.target.value)}
                  className="form-select !w-auto !py-1.5 text-sm"
                >
                  <option value="admin">Membro</option>
                  <option value="super_admin">Coordenação</option>
                </select>
                <button
                  onClick={() => remover(p.id, p.nome)}
                  title="Remover acesso"
                  className="w-8 h-8 grid place-items-center rounded-lg text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
