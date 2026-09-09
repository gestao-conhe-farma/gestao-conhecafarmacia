'use client'

import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { alterarPalavraPasse } from './actions'

export default function CartaoPalavraPasse() {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [aGuardar, setAGuardar] = useState(false)
  const [msg, setMsg] = useState(null)
  const [erro, setErro] = useState(null)

  function limpar() {
    setAtual('')
    setNova('')
    setConfirmar('')
  }

  async function guardar(e) {
    e.preventDefault()
    setErro(null)
    setMsg(null)

    if (nova !== confirmar) {
      setErro('A confirmação não coincide com a nova palavra-passe.')
      return
    }

    setAGuardar(true)
    try {
      const r = await alterarPalavraPasse({ atual, nova })
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setMsg('Palavra-passe alterada. As outras sessões foram terminadas por segurança.')
      limpar()
    } finally {
      setAGuardar(false)
    }
  }

  const forca =
    (nova.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(nova) ? 1 : 0) +
    (/[0-9]/.test(nova) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(nova) ? 1 : 0)
  const rotuloForca = ['Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Muito forte'][forca]
  const corForca = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-brand-accent', 'bg-brand-accent'][forca]

  return (
    <div className="card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center">
          <KeyRound size={20} />
        </span>
        <h2 className="font-display text-xl font-bold text-brand-deep">Palavra-passe</h2>
      </div>
      <p className="text-sm text-brand-deep/55 mb-6">
        Usa pelo menos 8 caracteres, com maiúsculas, números e símbolos.
      </p>

      <form onSubmit={guardar} className="space-y-4">
        <div className="form-group">
          <label className="form-label" htmlFor="p-atual">Palavra-passe atual</label>
          <div className="relative">
            <input
              id="p-atual"
              type={mostrar ? 'text' : 'password'}
              className="form-input pr-11"
              autoComplete="current-password"
              required
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
            />
            <BotaoMostrar mostrar={mostrar} alternar={() => setMostrar((v) => !v)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="p-nova">Nova palavra-passe</label>
            <div className="relative">
              <input
                id="p-nova"
                type={mostrar ? 'text' : 'password'}
                className="form-input pr-11"
                autoComplete="new-password"
                minLength={8}
                required
                value={nova}
                onChange={(e) => setNova(e.target.value)}
              />
              <BotaoMostrar mostrar={mostrar} alternar={() => setMostrar((v) => !v)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="p-conf">Confirmar nova</label>
            <div className="relative">
              <input
                id="p-conf"
                type={mostrar ? 'text' : 'password'}
                className="form-input pr-11"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
              <BotaoMostrar mostrar={mostrar} alternar={() => setMostrar((v) => !v)} />
            </div>
          </div>
        </div>

        {nova && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-brand-divider/60 overflow-hidden">
              <div className={`h-full ${corForca} transition-all duration-300`} style={{ width: `${(forca / 4) * 100}%` }} />
            </div>
            <span className="text-xs text-brand-deep/55 w-20">{rotuloForca}</span>
          </div>
        )}

        {erro && (
          <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{erro}</p>
        )}
        {msg && (
          <p className="text-sm text-brand-accent bg-brand-accent/10 border border-brand-accent/20 rounded-lg px-4 py-3">{msg}</p>
        )}

        <button type="submit" disabled={aGuardar} className="btn btn-primary">
          {aGuardar ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
          {aGuardar ? 'A alterar…' : 'Alterar palavra-passe'}
        </button>
      </form>
    </div>
  )
}

function BotaoMostrar({ mostrar, alternar }) {
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={mostrar ? 'Ocultar palavras-passe' : 'Mostrar palavras-passe'}
      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-brand-deep/40 hover:text-brand-deep transition-colors"
    >
      {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}
