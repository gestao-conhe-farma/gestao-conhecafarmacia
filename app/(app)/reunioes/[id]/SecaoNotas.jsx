'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Lock, Pencil, Send, Trash2, X } from 'lucide-react'
import { adicionarNota, editarNota, apagarNota } from '../actions'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

export default function SecaoNotas({ reuniaoId, notas, pessoaAtualId, ehSuper, ataPublicada, num }) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState(null)
  const [aEditar, setAEditar] = useState(null)
  const [textoEdicao, setTextoEdicao] = useState('')
  const [aProcessar, setAProcessar] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    if (!texto.trim()) return
    setAEnviar(true)
    try {
      const r = await adicionarNota(reuniaoId, texto)
      if (!r.ok) setErro(r.erro)
      else {
        setTexto('')
        router.refresh()
      }
    } finally {
      setAEnviar(false)
    }
  }

  async function guardarEdicao(notaId) {
    setAProcessar(notaId)
    try {
      const r = await editarNota(reuniaoId, notaId, textoEdicao)
      if (!r.ok) setErro(r.erro)
      else {
        setAEditar(null)
        router.refresh()
      }
    } finally {
      setAProcessar(null)
    }
  }

  async function eliminar(notaId) {
    const ok = await pedirConfirmacao({
      titulo: 'Apagar esta nota?',
      confirmarTxt: 'Apagar',
      perigoso: true,
    })
    if (!ok) return
    setAProcessar(notaId)
    try {
      const r = await apagarNota(reuniaoId, notaId)
      if (!r.ok) alert(r.erro)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  function iniciarEdicao(nota) {
    setAEditar(nota.id)
    setTextoEdicao(nota.conteudo)
  }

  return (
    <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
      <span className="sec-num">{num}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">Notas da equipa</h2>
          {ataPublicada && (
            <span className="badge bg-brand-deep/5 text-brand-deep/50 normal-case">
              <Lock size={11} /> Fechadas — ata publicada
            </span>
          )}
        </div>

        {/* Thread */}
        {notas.length === 0 ? (
          <p className="mt-4 text-sm text-brand-deep/45 italic">
            Sem notas{ataPublicada ? '.' : ' — sê a primeira a contribuir.'}
          </p>
        ) : (
          <ul className="mt-5 space-y-4 max-w-2xl">
            {notas.map((n) => {
              const minha = n.autor_id === pessoaAtualId
              const possoEditar = minha && !ataPublicada
              const possoApagar = ehSuper || (minha && !ataPublicada)
              return (
                <li key={n.id} className="flex gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary grid place-items-center font-bold text-[11px] shrink-0 mt-0.5">
                    {n.autor?.nome?.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    {aEditar === n.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="form-textarea text-sm"
                          rows={3}
                          value={textoEdicao}
                          onChange={(e) => setTextoEdicao(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => guardarEdicao(n.id)}
                            disabled={aProcessar === n.id}
                            className="btn btn-accent btn-small"
                          >
                            {aProcessar === n.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Guardar
                          </button>
                          <button
                            onClick={() => setAEditar(null)}
                            className="btn btn-small btn-ghost border border-brand-divider"
                          >
                            <X size={13} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed text-brand-deep/85 whitespace-pre-line">
                          {n.conteudo}
                        </p>
                        <p className="text-[11px] text-brand-deep/40 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-brand-deep/60">{n.autor?.nome}</span>
                          {new Date(n.criado_em).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {n.editado_em && ' · editada'}
                          {possoEditar && (
                            <button
                              onClick={() => iniciarEdicao(n)}
                              className="hover:text-brand-primary transition-colors"
                              title="Editar"
                            >
                              <Pencil size={11} />
                            </button>
                          )}
                          {possoApagar && (
                            <button
                              onClick={() => eliminar(n.id)}
                              disabled={aProcessar === n.id}
                              className="hover:text-red-500 transition-colors"
                              title={ehSuper && !minha ? 'Moderar (apagar)' : 'Apagar'}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Nova nota */}
        {!ataPublicada ? (
          <form onSubmit={enviar} className="mt-6 max-w-2xl">
            <div className="flex gap-2 items-start">
              <textarea
                className="form-textarea text-sm flex-1"
                rows={2}
                placeholder="Escreve uma nota sobre a reunião…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <button
                type="submit"
                disabled={aEnviar || !texto.trim()}
                className="btn btn-accent btn-small shrink-0 mt-1"
                aria-label="Adicionar nota"
              >
                {aEnviar ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
            {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
          </form>
        ) : (
          erro && <p className="text-sm text-red-600 mt-3">{erro}</p>
        )}

        {caixaConfirmacao}
      </div>
    </section>
  )
}
