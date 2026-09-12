'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { criarConteudo, atualizarConteudo } from './actions'
import { PLATAFORMAS, CORES_PLATAFORMA, CORES_ESTADO } from './constants'

const vazios = {
  titulo: '',
  descricao: '',
  plataforma: 'instagram',
  dataPublicacao: '',
  estado: 'ideia',
  linkPublicacao: '',
}

/**
 * Formulário inline (linha expansível) para criar ou editar um conteúdo.
 * Reutilizado pela lista e pelo atalho "novo tema".
 */
export default function FormConteudo({ inicial = null, dataSugerida = null, onFechar }) {
  const [dados, setDados] = useState(
    inicial
      ? {
          titulo: inicial.titulo,
          descricao: inicial.descricao ?? '',
          plataforma: inicial.plataforma,
          dataPublicacao: String(inicial.data_publicacao).slice(0, 10),
          estado: inicial.estado,
          linkPublicacao: inicial.link_publicacao ?? '',
        }
      : { ...vazios, dataPublicacao: dataSugerida ?? '' }
  )
  const [aProcessar, setAProcessar] = useState(false)
  const [erro, setErro] = useState(null)

  function set(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }))
  }

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setAProcessar(true)
    try {
      const res = inicial
        ? await atualizarConteudo(inicial.id, dados)
        : await criarConteudo(dados)
      if (!res.ok) {
        setErro(res.erro)
        return
      }
      onFechar()
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <form onSubmit={submeter} className="bg-brand-primary/[0.04] border border-brand-divider rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep/50">
          {inicial ? 'Editar conteúdo' : 'Novo conteúdo'}
        </p>
        <button type="button" onClick={onFechar} className="text-brand-deep/40 hover:text-brand-deep" aria-label="Fechar">
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="sm:col-span-2 block">
          <span className="text-xs font-semibold text-brand-deep/70">Tema / título *</span>
          <input
            value={dados.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            placeholder="ex.: Automedicação: riscos e cuidados"
            className="input mt-1 w-full"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-brand-deep/70">Plataforma *</span>
          <select value={dados.plataforma} onChange={(e) => set('plataforma', e.target.value)} className="input mt-1 w-full">
            {PLATAFORMAS.map((p) => (
              <option key={p} value={p}>{CORES_PLATAFORMA[p].label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-brand-deep/70">Data de saída *</span>
          <input
            type="date"
            value={dados.dataPublicacao}
            onChange={(e) => set('dataPublicacao', e.target.value)}
            className="input mt-1 w-full"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-brand-deep/70">Estado</span>
          <select value={dados.estado} onChange={(e) => set('estado', e.target.value)} className="input mt-1 w-full">
            {Object.entries(CORES_ESTADO).map(([valor, { label }]) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-brand-deep/70">Link (depois de sair)</span>
          <input
            value={dados.linkPublicacao}
            onChange={(e) => set('linkPublicacao', e.target.value)}
            placeholder="https://…"
            className="input mt-1 w-full"
          />
        </label>

        <label className="sm:col-span-2 block">
          <span className="text-xs font-semibold text-brand-deep/70">Notas / guião</span>
          <textarea
            value={dados.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            rows={2}
            placeholder="Ângulo, fontes, quem grava…"
            className="input mt-1 w-full resize-none"
          />
        </label>
      </div>

      {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onFechar} className="btn btn-ghost btn-small border border-brand-divider">
          Cancelar
        </button>
        <button type="submit" disabled={aProcessar} className="btn btn-primary btn-small">
          {aProcessar && <Loader2 size={13} className="animate-spin" />}
          {inicial ? 'Guardar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
