'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FileDown, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'
import { registarAnexoReuniao, removerAnexoReuniao } from '../actions'
import { formatarTamanho } from '@/lib/documentos'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

export default function SecaoAnexos({ reuniaoId, anexos, ehSuper, num }) {
  const router = useRouter()
  const refInput = useRef(null)
  const [aCarregar, setACarregar] = useState(false)
  const [erro, setErro] = useState(null)
  const [aProcessar, setAProcessar] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  async function carregar(e) {
    const ficheiro = e.target.files?.[0]
    e.target.value = ''
    if (!ficheiro) return
    setErro(null)
    setACarregar(true)
    try {
      // Upload direto do browser para o bucket privado (RLS: só super_admin)
      const path = `reunioes/${reuniaoId}/${Date.now()}-${ficheiro.name}`
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()
      const { error: erroUpload } = await supabase.storage
        .from('documentos')
        .upload(path, ficheiro, { cacheControl: '3600', upsert: false })
      if (erroUpload) {
        setErro(erroUpload.message)
        return
      }
      const r = await registarAnexoReuniao(reuniaoId, {
        storagePath: path,
        nomeFicheiro: ficheiro.name,
        mimeType: ficheiro.type || null,
        tamanhoBytes: ficheiro.size,
      })
      if (!r.ok) setErro(r.erro)
      else router.refresh()
    } finally {
      setACarregar(false)
    }
  }

  async function remover(anexoId) {
    const ok = await pedirConfirmacao({
      titulo: 'Remover este anexo?',
      descricao: 'O ficheiro é também removido do armazenamento.',
      confirmarTxt: 'Remover',
      perigoso: true,
    })
    if (!ok) return
    setAProcessar(anexoId)
    try {
      const r = await removerAnexoReuniao(reuniaoId, anexoId)
      if (!r.ok) alert(r.erro)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  async function descarregar(storagePath, nomeFicheiro) {
    const { createClient } = await import('@/lib/supabase/browser')
    const supabase = createClient()
    const { data } = await supabase.storage.from('documentos').createSignedUrl(storagePath, 60)
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = nomeFicheiro
      a.click()
    }
  }

  return (
    <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
      <span className="sec-num">{num}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">Anexos</h2>
          {ehSuper && (
            <>
              <input ref={refInput} type="file" className="hidden" onChange={carregar} />
              <button
                onClick={() => refInput.current?.click()}
                disabled={aCarregar}
                className="btn btn-small btn-ghost border border-brand-divider text-brand-deep/70"
              >
                {aCarregar ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Anexar ficheiro
              </button>
            </>
          )}
        </div>

        {erro && <p className="text-sm text-red-600 mt-3">{erro}</p>}

        {anexos.length === 0 ? (
          <p className="mt-4 text-sm text-brand-deep/45 italic">Sem anexos.</p>
        ) : (
          <ul className="mt-4 max-w-2xl divide-y divide-brand-divider/70 border border-brand-divider rounded-xl overflow-hidden">
            {anexos.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <Paperclip size={15} className="text-brand-deep/40 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-deep truncate">{a.nome_ficheiro}</p>
                  <p className="text-[11px] text-brand-deep/45">
                    {formatarTamanho(a.tamanho_bytes)} · {a.criado_por?.nome}
                  </p>
                </div>
                <button
                  onClick={() => descarregar(a.storage_path ?? a.caminho, a.nome_ficheiro)}
                  title="Descarregar"
                  className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/45 hover:text-brand-accent transition-colors"
                >
                  <FileDown size={15} />
                </button>
                {ehSuper && (
                  <button
                    onClick={() => remover(a.id)}
                    disabled={aProcessar === a.id}
                    title="Remover"
                    className="w-8 h-8 grid place-items-center rounded-lg text-red-500/60 hover:text-red-600 transition-colors"
                  >
                    {aProcessar === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {caixaConfirmacao}
      </div>
    </section>
  )
}
