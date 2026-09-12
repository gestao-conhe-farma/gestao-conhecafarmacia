'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Megaphone, Send, Trash2 } from 'lucide-react'
import { criarAnuncio, apagarAnuncio } from './actions'

/**
 * Formulário da coordenação para publicar um anúncio (comunicado
 * geral). O resumo de reunião entra pelo atalho na SecaoResumo, que
 * chama a mesma action com o reuniao_id.
 */
export default function FormAnuncio() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [link, setLink] = useState('')
  const [erro, setErro] = useState(null)
  const [aEnviar, iniciarEnvio] = useTransition()

  function submeter(e) {
    e.preventDefault()
    const t = titulo.trim()
    const c = corpo.trim()
    if (!t || !c) return
    iniciarEnvio(async () => {
      const r = await criarAnuncio(t, c, null, link.trim() || null)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setTitulo('')
      setCorpo('')
      setLink('')
      setAberto(false)
      router.refresh()
    })
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="btn btn-accent mt-6">
        <Megaphone size={16} />
        Novo anúncio
      </button>
    )
  }

  return (
    <form onSubmit={submeter} className="card p-6 mt-6 space-y-3">
      <h2 className="text-base font-bold text-brand-deep">Novo anúncio para toda a equipa</h2>
      <input
        className="form-input"
        maxLength={200}
        placeholder="Título do anúncio"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />
      <textarea
        className="form-textarea"
        rows={5}
        maxLength={4000}
        placeholder="O que a equipa precisa de saber…"
        value={corpo}
        onChange={(e) => setCorpo(e.target.value)}
      />
      <div>
        <label className="block text-[12px] font-semibold text-brand-deep/60 mb-1">
          Ligação opcional (página interna)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            className="form-input flex-1 min-w-[220px]"
            maxLength={300}
            placeholder="/guia — o link aparece como “clica aqui” no anúncio"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          {link !== '/guia' && (
            <button
              type="button"
              onClick={() => setLink('/guia')}
              className="btn btn-small btn-ghost border border-brand-divider"
              title="Preenche com o guia da plataforma"
            >
              Apontar para o guia
            </button>
          )}
        </div>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={aEnviar || !titulo.trim() || !corpo.trim()} className="btn btn-primary btn-small">
          {aEnviar ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Publicar e notificar a equipa
        </button>
        <button type="button" onClick={() => setAberto(false)} className="btn btn-small btn-ghost border border-brand-divider">
          Cancelar
        </button>
      </div>
      <p className="text-[12px] text-brand-deep/45">
        Todos os membros ativos recebem notificação in-app e email.
      </p>
    </form>
  )
}

/** Botão de remover anúncio (só renderizado para super_admin). */
export function BotaoRemoverAnuncio({ anuncioId }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)

  async function remover() {
    if (!confirm('Remover este anúncio? Deixa de aparecer para a equipa.')) return
    setAProcessar(true)
    try {
      await apagarAnuncio(anuncioId)
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <button
      onClick={remover}
      disabled={aProcessar}
      title="Remover anúncio"
      className="shrink-0 w-8 h-8 grid place-items-center rounded-lg text-brand-deep/35 hover:text-red-500 hover:bg-red-500/10 transition-colors"
    >
      {aProcessar ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  )
}
