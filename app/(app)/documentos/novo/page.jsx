import { redirect } from 'next/navigation'
import { exigirUtilizador } from '@/lib/supabase/server'
import { listarCategoriasDocs } from '@/lib/dados'
import FormNovoDocumento from './FormNovoDocumento'

export const metadata = { title: 'Adicionar documento' }

export default async function PaginaNovoDocumento() {
  const { pessoa } = await exigirUtilizador()
  if (pessoa.role !== 'super_admin') redirect('/documentos')

  const categorias = await listarCategoriasDocs()

  return (
    <div className="container-app max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-deep mb-2">
        Adicionar documento
      </h1>
      <p className="text-brand-deep/60 mb-8">
        O ficheiro é enviado diretamente para o armazenamento seguro (privado)
        e fica disponível para a equipa.
      </p>

      <div className="card p-6 md:p-8">
        <FormNovoDocumento categorias={categorias} />
      </div>
    </div>
  )
}
