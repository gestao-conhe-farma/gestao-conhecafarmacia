'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { atualizarContactos } from '../actions'

/**
 * Editar os próprios contactos (telefone / WhatsApp) — só visível
 * no perfil do próprio membro. Formato internacional +código país.
 */
export default function FormContactos({ pessoa }) {
  const router = useRouter()
  const [telefone, setTelefone] = useState(pessoa.telefone ?? '')
  const [whatsapp, setWhatsapp] = useState(pessoa.whatsapp ?? '')
  const [aGuardar, setAGuardar] = useState(false)
  const [msg, setMsg] = useState(null)
  const [erro, setErro] = useState(null)

  const alterado =
    telefone !== (pessoa.telefone ?? '') || whatsapp !== (pessoa.whatsapp ?? '')

  async function guardar(e) {
    e.preventDefault()
    setErro(null)
    setMsg(null)
    setAGuardar(true)
    try {
      const r = await atualizarContactos({ telefone, whatsapp })
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setMsg('Contactos atualizados.')
      router.refresh()
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4 max-w-md">
      <div className="form-group">
        <label className="form-label" htmlFor="c-telefone">Telefone</label>
        <input
          id="c-telefone"
          className="form-input"
          type="tel"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="+258 84 123 4567"
          autoComplete="tel"
        />
        <p className="text-xs text-brand-deep/45 mt-1">
          Formato internacional: + código do país e número. Tocar no número de
          alguém abre o teclado de chamadas do dispositivo.
        </p>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="c-whatsapp">WhatsApp</label>
        <input
          id="c-whatsapp"
          className="form-input"
          type="tel"
          inputMode="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+258 87 765 4321"
          autoComplete="tel"
        />
        <p className="text-xs text-brand-deep/45 mt-1">
          Tocar no WhatsApp de alguém abre a conversa no aplicativo.
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
        {aGuardar ? 'A guardar…' : 'Guardar contactos'}
      </button>
    </form>
  )
}
