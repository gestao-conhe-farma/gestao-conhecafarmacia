'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FileText, Loader2, Lock, Save, Send } from 'lucide-react'
import { publicarResumo, guardarRascunhoResumo } from '../actions'

export default function SecaoResumo({ reuniaoId, resumo, ataPublicada, estado, ehSuper, num }) {
  const router = useRouter()
  const [aEditar, setAEditar] = useState(false)
  const [texto, setTexto] = useState(resumo || '')
  const [anunciar, setAnunciar] = useState(false)
  const [aProcessar, setAProcessar] = useState(null)
  const [erro, setErro] = useState(null)

  async function acao(fn) {
    setAProcessar('form')
    setErro(null)
    try {
      const r = await fn()
      if (!r.ok) setErro(r.erro)
      else {
        setAEditar(false)
        router.refresh()
      }
    } finally {
      setAProcessar(null)
    }
  }

  return (
    <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
      <span className="sec-num">{num}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">Resumo final</h2>
          {ataPublicada && (
            <span className="badge badge-status-confirmado normal-case">
              <Lock size={11} /> Publicada {new Date(resumo_publicado_em_seguro()).toLocaleDateString('pt-PT')}
            </span>
          )}
        </div>

        {!aEditar && resumo ? (
          <>
            <div className="card p-5 mt-4 max-w-2xl">
              <p className="text-sm leading-relaxed text-brand-deep/85 whitespace-pre-line">
                {resumo}
              </p>
            </div>
            {ehSuper && !ataPublicada && (
              <button onClick={() => setAEditar(true)} className="btn btn-small btn-ghost border border-brand-divider mt-3">
                <FileText size={14} />
                Editar resumo
              </button>
            )}
          </>
        ) : !aEditar ? (
          <div className="mt-4 max-w-2xl">
            <p className="text-sm text-brand-deep/50 italic">
              Ainda sem resumo{ehSuper ? ' — escreve e publica a ata final.' : '.'}
            </p>
            {ehSuper && estado !== 'cancelada' && (
              <button onClick={() => setAEditar(true)} className="btn btn-accent btn-small mt-3">
                <FileText size={14} />
                Escrever resumo final
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 max-w-2xl space-y-3">
            <textarea
              className="form-textarea"
              rows={8}
              placeholder="Resumo da reunião: decisões, pontos principais, encaminhamentos…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => acao(() => publicarResumo(reuniaoId, texto, anunciar))}
                disabled={aProcessar === 'form' || !texto.trim()}
                className="btn btn-primary btn-small"
                title="Publica a ata e congela as notas"
              >
                {aProcessar === 'form' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Publicar ata (congela notas)
              </button>
              <label className="flex items-center gap-2 text-[13px] text-brand-deep/70 select-none cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={anunciar}
                  onChange={(e) => setAnunciar(e.target.checked)}
                  className="accent-brand-primary w-4 h-4"
                />
                Publicar também como anúncio (toda a equipa, com email)
              </label>
              <button
                onClick={() => acao(() => guardarRascunhoResumo(reuniaoId, texto))}
                disabled={aProcessar === 'form'}
                className="btn btn-small btn-ghost border border-brand-divider"
              >
                <Save size={14} />
                Guardar rascunho
              </button>
              <button onClick={() => setAEditar(false)} className="btn btn-small btn-ghost border border-brand-divider">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function resumo_publicado_em_seguro() {
  return new Date()
}
