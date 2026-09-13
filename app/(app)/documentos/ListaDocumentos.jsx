'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download,
  Eye,
  Loader2,
  Lock,
  Pencil,
  Trash2,
} from 'lucide-react'
import { formatarTamanho } from '@/lib/documentos'
import { eliminarDocumento } from './actions'
import PreVisualizador from './PreVisualizador'
import EditarDocumento from './EditarDocumento'
import { useConfirmacao, NotaFlutuante } from '@/components/CaixaConfirmacao'

function chipFicheiro(mime) {
  if (mime?.startsWith('image/')) return { cls: 'file-img', label: 'IMG' }
  if (mime?.includes('spreadsheet') || mime?.includes('excel') || mime?.includes('csv'))
    return { cls: 'file-xls', label: 'XLS' }
  if (mime?.includes('word') || mime?.includes('document') || mime?.includes('rtf'))
    return { cls: 'file-doc', label: 'DOC' }
  return { cls: 'file-pdf', label: 'PDF' }
}

export default function ListaDocumentos({ documentos, categorias = [], ehSuper }) {
  const router = useRouter()
  const [aEliminar, setAEliminar] = useState(null)
  const [emPreview, setEmPreview] = useState(null)
  const [emEdicao, setEmEdicao] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  async function eliminar(id, titulo) {
    const ok = await pedirConfirmacao({
      titulo: `Eliminar “${titulo}”?`,
      descricao: 'O ficheiro é removido permanentemente da biblioteca e do armazenamento.',
      confirmarTxt: 'Eliminar',
      perigoso: true,
    })
    if (!ok) return
    setAEliminar(id)
    try {
      const r = await eliminarDocumento(id)
      if (!r.ok) setAviso(r.erro)
      router.refresh()
    } finally {
      setAEliminar(null)
    }
  }

  return (
    <>
    <ul className="border-t border-brand-divider">
      {documentos.map((doc) => {
        const chip = chipFicheiro(doc.mime_type)
        return (
          <li
            key={doc.id}
            className="border-b border-brand-divider py-4 px-1 -mx-1 flex items-center gap-4 hover:bg-brand-primary/[0.03] transition-colors"
          >
            {/* Monograma do formato */}
            <span className={`file-chip ${chip.cls}`} aria-hidden="true">
              {chip.label}
            </span>

            {/* Título + código */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-brand-deep text-[14.5px] min-w-0 truncate">
                  {doc.titulo}
                </p>
                {doc.restrito && (
                  <span
                    className="badge bg-amber-500/10 text-amber-600 shrink-0"
                    title="Visível apenas à coordenação"
                  >
                    <Lock size={10} /> Restrito
                  </span>
                )}
              </div>
              {doc.descricao && (
                <p className="text-[13px] text-brand-deep/60 leading-snug mt-0.5 line-clamp-2">
                  {doc.descricao}
                </p>
              )}
              <p className="text-xs font-mono tracking-wide text-brand-deep/45 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {doc.codigo && <span>{doc.codigo}</span>}
                <span className="font-sans">{doc.categoria?.nome ?? 'Sem categoria'}</span>
                <span className="font-sans">{formatarTamanho(doc.tamanho_bytes)}</span>
                {doc.criado_por?.nome && (
                  <span className="font-sans hidden sm:inline">
                    por {doc.criado_por.nome}
                  </span>
                )}
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 shrink-0">
              {aEliminar === doc.id ? (
                <Loader2 size={18} className="animate-spin text-brand-accent" />
              ) : (
                <>
                  {/* O botão aparece sempre: formatos sem renderização
                      nativa recebem um aviso honesto com download dentro
                      do próprio modal (ver PreVisualizador). */}
                  <button
                    onClick={() => setEmPreview(doc)}
                    aria-label={`Pré-visualizar ${doc.titulo}`}
                    title="Pré-visualizar"
                    className="w-9 h-9 grid place-items-center rounded-lg border border-transparent text-brand-deep/45 hover:text-brand-primary hover:border-brand-divider transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <a
                    href={`/documentos/${doc.id}/download`}
                    aria-label={`Descarregar ${doc.titulo}`}
                    title="Descarregar"
                    className="w-9 h-9 grid place-items-center rounded-lg border border-transparent text-brand-deep/45 hover:text-brand-accent hover:border-brand-divider transition-colors"
                  >
                    <Download size={16} />
                  </a>
                  {ehSuper && (
                    <button
                      onClick={() => setEmEdicao(doc)}
                      aria-label={`Editar ${doc.titulo}`}
                      title="Editar"
                      className="w-9 h-9 grid place-items-center rounded-lg border border-transparent text-brand-deep/45 hover:text-brand-primary hover:border-brand-divider transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {ehSuper && (
                    <button
                      onClick={() => eliminar(doc.id, doc.titulo)}
                      aria-label={`Eliminar ${doc.titulo}`}
                      title="Eliminar"
                      className="w-9 h-9 grid place-items-center rounded-lg border border-transparent text-red-500/60 hover:text-red-600 hover:border-red-500/30 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>

    {emPreview && <PreVisualizador doc={emPreview} fechar={() => setEmPreview(null)} />}
    {emEdicao && (
      <EditarDocumento doc={emEdicao} categorias={categorias} fechar={() => setEmEdicao(null)} />
    )}
    {aviso && <NotaFlutuante mensagem={aviso} aoFechar={() => setAviso(null)} />}
    {caixaConfirmacao}
    </>
  )
}
