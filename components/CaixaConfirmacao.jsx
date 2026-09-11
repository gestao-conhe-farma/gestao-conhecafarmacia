'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, X } from 'lucide-react'

/**
 * CaixaConfirmacao — substituto estilizado do confirm() do navegador.
 *
 * Uso via hook:
 *   const [pedir, elemento] = useConfirmacao()
 *   const ok = await pedir({ titulo: 'Eliminar “X”?', descricao: '…' })
 *   if (!ok) return
 *   …
 *   {elemento}
 *
 * Comportamento: Esc cancela, overlay clica para cancelar, foco vai para
 * o botão perigoso (ação destrutiva), foco devolvido ao fechar.
 */

export function useConfirmacao() {
  const [opcoes, setOpcoes] = useState(null) // null = fechada
  const [resposta, setResposta] = useState(null) // fn pendente de resolução

  const pedir = useCallback(
    (op) =>
      new Promise((resolve) => {
        setOpcoes(op)
        setResposta(() => resolve)
      }),
    []
  )

  const fechar = useCallback(
    (resultado) => {
      setOpcoes(null)
      if (resposta) {
        resposta(resultado)
        setResposta(null)
      }
    },
    [resposta]
  )

  const elemento = opcoes ? <CaixaConfirmacao opcoes={opcoes} fechar={fechar} /> : null
  return [pedir, elemento]
}

function CaixaConfirmacao({ opcoes, fechar }) {
  const [montado, setMontado] = useState(false)
  const refPerigoso = useRef(null)
  const refGatilho = useRef(null)

  const {
    titulo,
    descricao,
    confirmarTxt = 'Confirmar',
    cancelarTxt = 'Cancelar',
    perigoso = false,
    extra = null, // nó React opcional (ex.: caixa de texto obrigatória)
  } = opcoes

  useEffect(() => {
    setMontado(true)
    refGatilho.current = document.activeElement
    // foco no botão de ação no próximo frame (após montar o portal)
    const t = requestAnimationFrame(() => {
      ;(perigoso ? refPerigoso.current : refPerigoso.current)?.focus()
    })
    const aoTeclar = (e) => {
      if (e.key === 'Escape') fechar(false)
      if (e.key === 'Tab' && e.shiftKey) {
        // focus trap simples: dois botões, shift+tab volta ao cancelar
        e.preventDefault()
        refPerigoso.current?.previousElementSibling?.focus?.()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => {
      cancelAnimationFrame(t)
      window.removeEventListener('keydown', aoTeclar)
      refGatilho.current?.focus?.()
    }
  }, [fechar, perigoso])

  if (!montado) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar(false)
      }}
      role="alertdialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="w-full max-w-sm bg-brand-card border border-brand-divider rounded-2xl shadow-md-soft overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-3.5">
            {perigoso ? (
              <span className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 grid place-items-center shrink-0">
                <AlertTriangle size={19} />
              </span>
            ) : (
              <span className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent grid place-items-center shrink-0">
                <AlertTriangle size={19} />
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-bold text-brand-deep text-[15px] leading-snug">{titulo}</p>
              {descricao && (
                <p className="text-sm text-brand-deep/60 mt-1.5 leading-relaxed">{descricao}</p>
              )}
              {extra}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6">
          <button
            onClick={() => fechar(false)}
            className="btn btn-small btn-secondary"
          >
            {cancelarTxt}
          </button>
          <button
            ref={refPerigoso}
            onClick={() => fechar(true)}
            className={`btn btn-small ${perigoso ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmarTxt}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Notificação estilizada (substituto de alert) — some sozinha. */
export function NotaFlutuante({ mensagem, aoFechar }) {
  useEffect(() => {
    const t = setTimeout(aoFechar, 6000)
    return () => clearTimeout(t)
  }, [aoFechar, mensagem])

  return createPortal(
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[calc(100%-2rem)] bg-brand-deep text-white text-sm rounded-xl px-5 py-3.5 shadow-md-soft flex items-center gap-3"
    >
      <span className="flex-1">{mensagem}</span>
      <button
        onClick={aoFechar}
        aria-label="Fechar aviso"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={15} />
      </button>
    </div>,
    document.body
  )
}
