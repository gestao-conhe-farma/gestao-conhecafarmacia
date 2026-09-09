import Link from 'next/link'
import { FolderOpen, Plus } from 'lucide-react'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { listarCategoriasDocs, listarDocumentos } from '@/lib/dados'
import DocumentosFiltros from './DocumentosFiltros'
import ListaDocumentos from './ListaDocumentos'
import GestorCategorias from './GestorCategorias'

export const metadata = { title: 'Documentos' }

export default async function PaginaDocumentos({ searchParams }) {
  const { pessoa } = await getUtilizadorAtual()
  const params = await searchParams
  const categoriaId = params?.cat || ''
  const busca = params?.q || ''
  const ehSuper = pessoa.role === 'super_admin'

  const [categorias, documentos] = await Promise.all([
    listarCategoriasDocs(),
    listarDocumentos({ categoriaId: categoriaId || null, busca: busca || null }),
  ])

  const categoriaAtual = categorias.find((c) => c.id === categoriaId)

  return (
    <div className="container-app">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-accent">
            Biblioteca interna
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-deep mt-1">
            Documentos
          </h1>
          <p className="text-brand-deep/60 mt-1">
            Documentos oficiais do Conheça Farmácia — cartas, contratos, políticas e mais.
          </p>
        </div>
        {ehSuper && (
          <Link href="/documentos/novo" className="btn btn-primary">
            <Plus size={16} />
            Adicionar documento
          </Link>
        )}
      </div>

      <DocumentosFiltros categorias={categorias} categoriaAtual={categoriaId} busca={busca} />

      {ehSuper && (
        <div className="mt-4">
          <GestorCategorias categorias={categorias} />
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-brand-deep">
            {categoriaAtual ? categoriaAtual.nome : 'Todos os documentos'}
            <span className="ml-2 text-sm font-sans font-medium text-brand-deep/45">
              {documentos.length}
            </span>
          </h2>
        </div>

        {documentos.length === 0 ? (
          <div className="card empty-state">
            <FolderOpen size={36} className="mx-auto mb-3 text-brand-accent/50" />
            <p className="font-semibold text-brand-deep">Sem documentos</p>
            <p className="text-sm mt-1">
              {busca
                ? `Nada encontrado para “${busca}”.`
                : ehSuper
                  ? 'Adiciona o primeiro documento da equipa.'
                  : 'A coordenação ainda não adicionou documentos aqui.'}
            </p>
          </div>
        ) : (
          <ListaDocumentos documentos={documentos} ehSuper={ehSuper} />
        )}
      </div>
    </div>
  )
}
