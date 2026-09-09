'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileUp, Loader2, Lock, UploadCloud } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { BUCKET, EXT_ACEITES, TAMANHO_MAX_MB, construirPath, ficheiroValido } from '@/lib/documentos'
import { registarDocumento } from '../actions'

export default function FormNovoDocumento({ categorias }) {
  const router = useRouter()
  const inputFicheiro = useRef(null)

  const [ficheiro, setFicheiro] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [codigo, setCodigo] = useState('')
  const [restrito, setRestrito] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [fase, setFase] = useState('form') // form | aEnviar | aRegistar
  const [erro, setErro] = useState(null)

  function escolherFicheiro(e) {
    const f = e.target.files?.[0]
    setErro(null)
    if (!f) {
      setFicheiro(null)
      return
    }
    const v = ficheiroValido(f)
    if (!v.ok) {
      setErro(v.erro)
      e.target.value = ''
      setFicheiro(null)
      return
    }
    setFicheiro(f)
    // Sugere o título a partir do nome do ficheiro (sem extensão)
    if (!titulo) {
      setTitulo(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
    }
  }

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    if (!ficheiro) {
      setErro('Escolhe um ficheiro para enviar.')
      return
    }

    setFase('aEnviar')
    setProgresso(0)

    try {
      const supabase = getSupabaseBrowserClient()
      const path = construirPath(
        categorias.find((c) => c.id === categoriaId)?.nome,
        ficheiro.name
      )

      // Upload direto do browser para o Storage (respeita RLS)
      const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(path, ficheiro, {
        contentType: ficheiro.type || undefined,
        onUploadProgress: (evt) => {
          if (evt.total) setProgresso(Math.round((evt.loaded / evt.total) * 100))
        },
      })

      if (erroUpload) {
        setErro('Falha no envio: ' + erroUpload.message)
        setFase('form')
        return
      }

      // Registar metadados na BD
      setFase('aRegistar')
      const r = await registarDocumento({
        titulo,
        descricao,
        categoriaId,
        codigo,
        storagePath: path,
        nomeFicheiro: ficheiro.name,
        mimeType: ficheiro.type,
        tamanhoBytes: ficheiro.size,
        restrito,
      })

      if (!r.ok) {
        // Rollback do ficheiro órfão
        await supabase.storage.from(BUCKET).remove([path])
        setErro(r.erro)
        setFase('form')
        return
      }

      router.push('/documentos')
    } catch (errInesperado) {
      console.error('[novo documento]', errInesperado)
      setErro('Erro inesperado. Tenta novamente.')
      setFase('form')
    }
  }

  const aProcessar = fase === 'aEnviar' || fase === 'aRegistar'

  return (
    <form onSubmit={submeter} className="space-y-5">
      {/* Zona de ficheiro */}
      <div className="form-group">
        <span className="form-label">Ficheiro</span>
        <button
          type="button"
          onClick={() => inputFicheiro.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            ficheiro
              ? 'border-brand-accent bg-brand-accent/5'
              : 'border-brand-divider hover:border-brand-accent/50'
          }`}
        >
          <FileUp size={28} className="mx-auto text-brand-accent mb-2" />
          {ficheiro ? (
            <>
              <p className="font-semibold text-brand-deep text-sm">{ficheiro.name}</p>
              <p className="text-xs text-brand-deep/50 mt-0.5">
                {(ficheiro.size / (1024 * 1024)).toFixed(1)} MB — toca para trocar
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-brand-deep text-sm">
                Toca para escolher um ficheiro
              </p>
              <p className="text-xs text-brand-deep/50 mt-0.5">
                PDF, Word, TXT, HTML, Excel, PowerPoint ou imagem (máx. {TAMANHO_MAX_MB} MB)
              </p>
            </>
          )}
        </button>
        <input
          ref={inputFicheiro}
          type="file"
          accept={EXT_ACEITES}
          className="hidden"
          onChange={escolherFicheiro}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="doc-titulo">Título</label>
        <input
          id="doc-titulo"
          className="form-input"
          required
          placeholder="Ex.: Contrato de patrocínio — Fase 2"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label" htmlFor="doc-cat">Categoria</label>
          <select
            id="doc-cat"
            className="form-select"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
          >
            <option value="">— Sem categoria —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="doc-codigo">Código (opcional)</label>
          <input
            id="doc-codigo"
            className="form-input"
            placeholder="Ex.: CF-PAT-001-2026"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="doc-desc">Descrição (opcional)</label>
        <textarea
          id="doc-desc"
          className="form-textarea"
          placeholder="Contexto, versão, notas…"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      {/* Restrição */}
      <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-brand-divider/60 cursor-pointer hover:border-brand-accent/50 transition-colors">
        <input
          type="checkbox"
          checked={restrito}
          onChange={(e) => setRestrito(e.target.checked)}
          className="w-4 h-4 accent-[#0a844f]"
        />
        <Lock size={16} className="text-amber-600" />
        <span className="text-sm text-brand-deep">
          <strong>Restrito</strong> — visível apenas à coordenação
        </span>
      </label>

      {/* Progresso */}
      {fase === 'aEnviar' && (
        <div>
          <div className="flex justify-between text-xs text-brand-deep/60 mb-1">
            <span>A enviar ficheiro…</span>
            <span>{progresso}%</span>
          </div>
          <div className="h-2 rounded-full bg-brand-divider/60 overflow-hidden">
            <div className="h-full bg-brand-accent transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}
      {fase === 'aRegistar' && (
        <p className="text-sm text-brand-deep/60 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> A registar documento…
        </p>
      )}

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={aProcessar} className="btn btn-primary">
          {aProcessar ? <Loader2 className="animate-spin" size={17} /> : <UploadCloud size={17} />}
          {aProcessar ? 'A processar…' : 'Enviar documento'}
        </button>
        <Link href="/documentos" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Cancelar
        </Link>
      </div>
    </form>
  )
}
