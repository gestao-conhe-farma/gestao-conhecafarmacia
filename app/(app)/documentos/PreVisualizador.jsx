'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { renderAsync } from 'docx-preview'
import {
  X,
  Download,
  Loader2,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from 'lucide-react'

/**
 * PreVisualizador — modal de leitura de documentos.
 *
 * Suporte garantido:
 *  - PDF        → iframe nativo do browser (leitor integrado)
 *  - PNG/JPEG   → <img> em fundo de tabuleiro
 *  - HTML       → iframe sandbox (scripts desligados, CSS da letra mantém-se)
 *  - TXT        → texto simples com tipografia de leitura
 *  - DOCX       → renderização client-side com docx-preview (nada sai do
 *                 dispositivo — importante para documentos confidenciais)
 *
 * Outros formatos (XLS, PPT, DOC legado) → aviso honesto para descarregar.
 *
 * Segurança: o HTML é servido do MESMO domínio num iframe sandbox sem
 * allow-same-origin, portanto não pode aceder a cookies nem ao DOM da app.
 * Esc fecha, foco é devolvido ao gatilho, overlay clica para fechar.
 */
export default function PreVisualizador({ doc, fechar }) {
  const [montado, setMontado] = useState(false)
  const [estado, setEstado] = useState('a-carregar') // a-carregar | pronto | erro
  const [mensagemErro, setMensagemErro] = useState('')
  const [expandido, setExpandido] = useState(false)
  const [txt, setTxt] = useState('')
  const refDocx = useRef(null)
  const refIframe = useRef(null)
  const carregouRef = useRef(false) // evita duplo fetch/render (React StrictMode)

  const tipo = doc.mime_type || ''
  const extensao = (doc.nome_ficheiro?.split('.').pop() || '').toLowerCase()

  const ehPdf = tipo === 'application/pdf' || extensao === 'pdf'
  const ehImagem = tipo.startsWith('image/')
  const ehHtml = tipo === 'text/html' || extensao === 'html' || extensao === 'htm'
  const ehTxt = tipo === 'text/plain' || extensao === 'txt'
  const ehDocx =
    extensao === 'docx' ||
    tipo === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const suportado = ehPdf || ehImagem || ehHtml || ehTxt || ehDocx

  /* Montagem + Esc + bloqueio de scroll + foco */
  useEffect(() => {
    setMontado(true)
    const aoTeclar = (e) => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [fechar])

  /* Carregar DOCX (docx-preview) ou TXT (fetch → texto) */
  const carregar = useCallback(async () => {
    if (!suportado || carregouRef.current) return
    carregouRef.current = true
    setEstado('a-carregar')
    try {
      if (ehTxt || ehDocx) {
        const res = await fetch(`/documentos/${doc.id}/preview`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        if (ehTxt) {
          setTxt(await res.text())
        } else {
          const blob = await res.blob()
          // className default ('docx') → wrapper fica com class "docx-wrapper"
          await renderAsync(blob, refDocx.current, null, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            experimental: false,
            useBase64URL: true,
          })
        }
      }
      setEstado('pronto')
    } catch (e) {
      console.error('[preview] falha ao renderizar', e)
      setMensagemErro(
        'Não foi possível renderizar este documento no navegador. Descarrega-o para o visualizar.'
      )
      setEstado('erro')
    }
  }, [doc.id, ehDocx, ehTxt, suportado])

  useEffect(() => {
    carregar()
  }, [carregar])

  const urlPreview = `/documentos/${doc.id}/preview`

  const conteudo = () => {
    if (!suportado) {
      return (
        <div className="h-full grid place-items-center p-8">
          <div className="text-center max-w-sm">
            <AlertTriangle size={34} className="mx-auto text-amber-500/80" />
            <p className="font-semibold text-brand-deep mt-4">
              Pré-visualização não disponível
            </p>
            <p className="text-sm text-brand-deep/60 mt-2 leading-relaxed">
              O formato <strong>.{extensao || '?'}</strong> não pode ser
              mostrado no navegador. Descarrega o ficheiro para o abrir na
              aplicação adequada.
            </p>
            <a href={`/documentos/${doc.id}/download`} className="btn btn-primary btn-small mt-5">
              <Download size={15} />
              Descarregar
            </a>
          </div>
        </div>
      )
    }

    if (estado === 'erro') {
      return (
        <div className="h-full grid place-items-center p-8">
          <div className="text-center max-w-sm">
            <AlertTriangle size={34} className="mx-auto text-amber-500/80" />
            <p className="font-semibold text-brand-deep mt-4">Falha na pré-visualização</p>
            <p className="text-sm text-brand-deep/60 mt-2 leading-relaxed">{mensagemErro}</p>
            <a href={`/documentos/${doc.id}/download`} className="btn btn-primary btn-small mt-5">
              <Download size={15} />
              Descarregar
            </a>
          </div>
        </div>
      )
    }

    if (estado === 'a-carregar' && ehTxt) {
      return (
        <div className="h-full grid place-items-center">
          <Loader2 size={30} className="animate-spin text-brand-accent" />
        </div>
      )
    }

    if (ehPdf) {
      return (
        <iframe
          ref={refIframe}
          src={urlPreview}
          title={`Pré-visualização de ${doc.titulo}`}
          className="w-full h-full border-0 bg-brand-bg-alt"
          onLoad={() => setEstado('pronto')}
        />
      )
    }

    if (ehImagem) {
      return (
        <div className="h-full w-full grid place-items-center overflow-auto p-6 bg-[repeating-conic-gradient(var(--color-brand-bg-alt)_0%_25%,var(--color-brand-card)_0%_50%)] bg-[length:22px_22px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlPreview}
            alt={`Pré-visualização de ${doc.titulo}`}
            className="max-w-full max-h-full object-contain shadow-soft rounded-lg"
            onLoad={() => setEstado('pronto')}
          />
        </div>
      )
    }

    if (ehHtml) {
      return (
        <iframe
          ref={refIframe}
          srcDoc={undefined}
          src={urlPreview}
          title={`Pré-visualização de ${doc.titulo}`}
          sandbox=""
          className="w-full h-full border-0 bg-white"
          onLoad={() => setEstado('pronto')}
        />
      )
    }

    if (ehTxt) {
      return (
        <div className="h-full overflow-auto p-8">
          <pre className="max-w-2xl mx-auto whitespace-pre-wrap font-mono text-[13.5px] leading-relaxed text-brand-deep/85">
            {txt}
          </pre>
        </div>
      )
    }

    if (ehDocx) {
      return (
        <div className="h-full overflow-auto p-4 md:p-8 bg-brand-bg-alt relative">
          {/* O contentor tem de existir DESDE o início: o docx-preview escreve
              nele durante o carregamento. O spinner é um overlay, nunca um
              substituto — caso contrário refDocx.current é null e rebenta. */}
          {estado === 'a-carregar' && (
            <div className="absolute inset-0 grid place-items-center bg-brand-bg-alt/80">
              <Loader2 size={30} className="animate-spin text-brand-accent" />
            </div>
          )}
          <div
            ref={refDocx}
            className={`max-w-[830px] mx-auto bg-white rounded-lg shadow-soft ${
              estado === 'a-carregar' ? 'opacity-0' : 'opacity-100'
            } transition-opacity`}
          />
        </div>
      )
    }

    return null
  }

  if (!montado) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-3 md:p-8 bg-black/55 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Pré-visualização de ${doc.titulo}`}
    >
      <div
        className={`flex flex-col bg-brand-card border border-brand-divider rounded-2xl overflow-hidden shadow-md-soft w-full transition-[max-width] duration-300 ${
          expandido ? 'max-w-none h-full' : 'max-w-5xl max-h-full h-full'
        }`}
      >
        {/* Barra superior */}
        <div className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-brand-divider bg-brand-card shrink-0">
          <span className="file-chip file-pdf !w-9 !h-9 !text-[8.5px]" aria-hidden="true">
            {(extensao || '?').toUpperCase().slice(0, 4)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-deep text-[14px] truncate">{doc.titulo}</p>
            <p className="text-[11px] text-brand-deep/45 font-mono">
              {doc.codigo || '—'} · pré-visualização
            </p>
          </div>
          <button
            onClick={() => setExpandido((v) => !v)}
            aria-label={expandido ? 'Restaurar tamanho' : 'Expandir'}
            title={expandido ? 'Restaurar' : 'Expandir'}
            className="w-9 h-9 grid place-items-center rounded-lg text-brand-deep/55 hover:text-brand-deep hover:bg-brand-primary/5 transition-colors"
          >
            {expandido ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <a
            href={`/documentos/${doc.id}/download`}
            aria-label="Descarregar"
            title="Descarregar"
            className="w-9 h-9 grid place-items-center rounded-lg text-brand-deep/55 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors"
          >
            <Download size={16} />
          </a>
          <button
            onClick={fechar}
            aria-label="Fechar pré-visualização"
            className="w-9 h-9 grid place-items-center rounded-lg text-brand-deep/55 hover:text-brand-deep hover:bg-brand-primary/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 min-h-0 relative">{conteudo()}</div>
      </div>
    </div>,
    document.body
  )
}
