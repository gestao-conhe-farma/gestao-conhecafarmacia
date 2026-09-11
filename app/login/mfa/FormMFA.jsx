'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function FormMFA({ factorId }) {
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState(null)
  const [aProcessar, setAProcessar] = useState(false)

  async function submeter(e) {
    e.preventDefault()
    if (codigo.length !== 6) return
    setErro(null)
    setAProcessar(true)

    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId, codigo }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setErro(data?.erro ?? 'Código incorreto — tenta o próximo.')
        return
      }

      // Navegação DURA: o estado de sessão acabou de mudar (aal1 → aal2)
      // e router.replace + router.refresh no mesmo tique fazem duas
      // navegações concorrentes com a cache do router cheia de páginas
      // antigas — o ecrã ficava preso em /login/mfa ou negro até a
      // pessoa atualizar à mão. Uma carga nova de documento reavalia o
      // middleware com os cookies frescos e destrói a cache velha.
      window.location.replace('/')
    } catch {
      setErro('Erro de rede — tenta novamente.')
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <form onSubmit={submeter} className="space-y-5">
      <div className="form-group">
        <label className="form-label" htmlFor="codigo-mfa">
          Código da app autenticadora
        </label>
        <input
          id="codigo-mfa"
          className="form-input font-mono tracking-[0.3em] text-center text-lg"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          placeholder="000000"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>

      {erro && (
        <p className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={aProcessar || codigo.length !== 6}
        className="btn btn-accent w-full"
      >
        {aProcessar ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShieldCheck size={16} />
        )}
        Verificar e entrar
      </button>
    </form>
  )
}
