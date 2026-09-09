'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  File as FileIco,
  Loader2,
  Lock,
  Trash2,
} from 'lucide-react'
import { formatarTamanho } from '@/lib/documentos'
import { eliminarDocumento } from './actions'

function iconeFicheiro(mime) {
  if (mime?.startsWith('image/')) return FileImage
  if (mime?.includes('spreadsheet') || mime?.includes('excel')) return FileSpreadsheet
  return FileText
}

export default function ListaDocumentos({ documentos, ehSuper }) {
  const router = useRouter()
  const [aEliminar, setAEliminar] = useState(null)

  async function eliminar(id, titulo) {
    if (!confirm(`Eliminar “${titulo}”? O ficheiro é removido permanentemente.`)) return
    setAEliminar(id)
    try {
      const r = await eliminarDocumento(id)
      if (!r.ok) alert(r.erro)
      router.refresh()
    } finally {
      setAEliminar(null)
    }
  }

  return (
    <div className="card divide-y divide-brand-divider/60 overflow-hidden">
      {documentos.map((doc) => {
        const Icone = iconeFicheiro(doc.mime_type)
        return (
          <div key={doc.id} className="p-4 md:p-5 flex items-center gap-4 hover:bg-brand-primary/[0.03] transition-colors">
            <span className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center shrink-0">
              <Icone size={20} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-brand-deep truncate">{doc.titulo}</p>
                {doc.restrito && (
                  <span className="badge bg-amber-500/10 text-amber-600" title="Visível apenas à coordenação">
                    <Lock size={10} /> Restrito
                  </span>
                )}
                {doc.codigo && <span className="badge badge-tipo-evento normal-case">{doc.codigo}</span>}
              </div>
              <p className="text-xs text-brand-deep/50 mt-0.5 truncate">
                {doc.categoria?.nome ?? 'Sem categoria'}
                {' · '}
                {formatarTamanho(doc.tamanho_bytes)}
                {doc.criado_por?.nome && ` · adicionado por ${doc.criado_por.nome}`}
                {doc.descricao && ` — ${doc.descricao}`}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {aEliminar === doc.id ? (
                <Loader2 size={18} className="animate-spin text-brand-accent" />
              ) : (
                <>
                  <a
                    href={`/documentos/${doc.id}/download`}
                    className="btn btn-secondary btn-small"
                    title="Descarregar"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Descarregar</span>
                  </a>
                  {ehSuper && (
                    <button
                      onClick={() => eliminar(doc.id, doc.titulo)}
                      aria-label="Eliminar documento"
                      title="Eliminar"
                      className="w-8 h-8 grid place-items-center rounded-lg text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
