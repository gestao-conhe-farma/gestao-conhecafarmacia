import Link from 'next/link'
import { FolderOpen, Plus } from 'lucide-react'
import { exigirUtilizador } from '@/lib/supabase/server'
import { listarCategoriasDocs, listarDocumentos } from '@/lib/dados'
import DocumentosFiltros from './DocumentosFiltros'
import ListaDocumentos from './ListaDocumentos'
import GestorCategorias from './GestorCategorias'

export const metadata = { title: 'Documentos' }

export default async function PaginaDocumentos({ searchParams }) {
  const { pessoa } = await exigirUtilizador()
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
      {/* Cabeçalho editorial com régua forte */}
      <div className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Biblioteca interna</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
              Documentos
            </h1>
            <p className="text-brand-deep/60 mt-2 max-w-xl leading-relaxed">
              Documentos oficiais do Conheça Farmácia — cartas, contratos,
              políticas e mais.
            </p>
          </div>
          {ehSuper && (
            <Link href="/documentos/novo" className="btn btn-primary shrink-0">
              <Plus size={16} />
              Adicionar documento
            </Link>
          )}
        </div>
      </div>

      <DocumentosFiltros categorias={categorias} categoriaAtual={categoriaId} busca={busca} />

      {ehSuper && <GestorCategorias categorias={categorias} />}

      <div className="mt-8">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">
            {categoriaAtual ? categoriaAtual.nome : 'Todos os documentos'}
          </h2>
          <p className="text-sm text-brand-deep/45 tabular-nums">
            <strong className="text-brand-deep">{documentos.length}</strong>{' '}
            {documentos.length === 1 ? 'ficheiro' : 'ficheiros'}
          </p>
        </div>

        {documentos.length === 0 ? (
          <div className="empty-state">
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
          <ListaDocumentos documentos={documentos} categorias={categorias} ehSuper={ehSuper} />
        )}
      </div>
    </div>
  )
}
